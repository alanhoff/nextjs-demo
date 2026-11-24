import { expect, test } from "@playwright/test";

test("nearby sites are ranked by distance from the catalog viewpoint", async ({ request }) => {
  const response = await request.get("/api/nearby?lat=34.011&lon=-116.168&limit=2");
  expect(response.ok()).toBe(true);
  expect(await response.text()).toBe(
    '{"sites":[{"slug":"joshua-tree","distanceKm":0},{"slug":"death-valley","distanceKm":301}]}',
  );
});

test("nearby identity adds only code and name without changing rank or distance", async ({ request }) => {
  const response = await request.get("/api/nearby?lat=34.011&lon=-116.168&limit=2&view=identity");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({
    sites: [
      { slug: "joshua-tree", code: "JOTR", name: "Joshua Tree", distanceKm: 0 },
      { slug: "death-valley", code: "DEVA", name: "Death Valley", distanceKm: 301 },
    ],
  });
});

test("nearby identity still filters by unrounded distance", async ({ request }) => {
  const viewpoint = "/api/nearby?lat=34.012&lon=-116.168&view=identity";
  const outside = await request.get(`${viewpoint}&radius_km=0.05`);
  expect(outside.status()).toBe(200);
  expect(await outside.json()).toEqual({ sites: [] });

  const inside = await request.get(`${viewpoint}&radius_km=0.2`);
  expect(inside.status()).toBe(200);
  expect(await inside.json()).toEqual({
    sites: [{ slug: "joshua-tree", code: "JOTR", name: "Joshua Tree", distanceKm: 0 }],
  });
});

test("nearby returns the full catalog by default", async ({ request }) => {
  const response = await request.get("/api/nearby?lat=44.330&lon=-68.184");
  expect(response.ok()).toBe(true);
  const { sites } = await response.json();
  expect(sites).toHaveLength(6);
  expect(sites[0]).toEqual({ slug: "acadia", distanceKm: 0 });
});

test("nearby filters by radius while respecting limit", async ({ request }) => {
  const response = await request.get("/api/nearby?lat=34.011&lon=-116.168&radius_km=1&limit=2");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ sites: [{ slug: "joshua-tree", distanceKm: 0 }] });
});

test("nearby applies the radius before rounding distances", async ({ request }) => {
  const viewpoint = "/api/nearby?lat=34.012&lon=-116.168";
  const outside = await request.get(`${viewpoint}&radius_km=0.05`);
  expect(outside.status()).toBe(200);
  expect(await outside.json()).toEqual({ sites: [] });

  const inside = await request.get(`${viewpoint}&radius_km=0.2`);
  expect(inside.status()).toBe(200);
  expect(await inside.json()).toEqual({ sites: [{ slug: "joshua-tree", distanceKm: 0 }] });
});

test("nearby lists supported parameters for unknown query names", async ({ request }) => {
  const openApiResponse = await request.get("/openapi.json");
  expect(openApiResponse.status()).toBe(200);
  const document = await openApiResponse.json();
  const declaredNames = document.paths["/api/nearby"].get.parameters
    .filter((parameter: { in: string }) => parameter.in === "query")
    .map((parameter: { name: string }) => parameter.name);

  for (const query of ["bogus=1", "view=identity&units=mi"]) {
    const response = await request.get(`/api/nearby?lat=34.011&lon=-116.168&limit=2&${query}`);
    expect(response.status()).toBe(400);
    expect(response.headers()["content-type"]).toBe("application/json");
    const body = await response.json();
    expect(body).toEqual({ error: "Supported parameters are lat, lon, limit, radius_km, view, state and exclude." });
    const advertisedNames = body.error
      .slice("Supported parameters are ".length, -1)
      .split(/, | and /);
    expect(advertisedNames.sort()).toEqual([...declaredNames].sort());
  }
});

test("nearby filters by state before limiting identity results", async ({ request }) => {
  const response = await request.get("/api/nearby?lat=34&lon=-116&state=Maine&limit=1&view=identity");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({
    sites: [{ slug: "acadia", code: "ACAD", name: "Acadia", distanceKm: 4215 }],
  });
});

test("nearby combines state and radius without changing distance order", async ({ request }) => {
  const california = "/api/nearby?lat=34&lon=-116&state=California";
  const response = await request.get(california);
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({
    sites: [{ slug: "joshua-tree", distanceKm: 16 }, { slug: "death-valley", distanceKm: 307 }],
  });

  const withinRadius = await request.get(`${california}&radius_km=100&limit=6`);
  expect(withinRadius.status()).toBe(200);
  expect(await withinRadius.json()).toEqual({ sites: [{ slug: "joshua-tree", distanceKm: 16 }] });

  const outsideRadius = await request.get("/api/nearby?lat=34&lon=-116&state=Maine&radius_km=100");
  expect(outsideRadius.status()).toBe(200);
  expect(await outsideRadius.json()).toEqual({ sites: [] });
});

test("nearby excludes an exact slug before limiting identity results", async ({ request }) => {
  const response = await request.get(
    "/api/nearby?lat=34&lon=-116&state=California&exclude=joshua-tree&limit=1&view=identity",
  );
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({
    sites: [{ slug: "death-valley", code: "DEVA", name: "Death Valley", distanceKm: 307 }],
  });
});

for (const query of ["exclude=joshua-tree&radius_km=100", "state=Maine&exclude=acadia"]) {
  test(`nearby combines exclusion with filters: ${query}`, async ({ request }) => {
    const response = await request.get(`/api/nearby?lat=34&lon=-116&${query}`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ sites: [] });
  });
}

for (const exclude of ["", "JOSHUA-TREE", "%20joshua-tree%20", "not-a-catalog-slug"]) {
  test(`nearby ignores unmatched exclude ${JSON.stringify(exclude)}`, async ({ request }) => {
    const response = await request.get(`/api/nearby?lat=34&lon=-116&exclude=${exclude}&limit=1`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ sites: [{ slug: "joshua-tree", distanceKm: 16 }] });
  });
}

test("nearby rejects repeated exclude parameters", async ({ request }) => {
  const response = await request.get("/api/nearby?lat=34&lon=-116&exclude=acadia&exclude=joshua-tree");
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: "Use exclude only once." });
});

for (const state of ["", "maine", "Maine%20", "Atlantis"]) {
  test(`nearby returns no sites for unmatched state ${JSON.stringify(state)}`, async ({ request }) => {
    const response = await request.get(`/api/nearby?lat=34&lon=-116&state=${state}`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ sites: [] });
  });
}

test("nearby rejects repeated state parameters", async ({ request }) => {
  const response = await request.get("/api/nearby?lat=34&lon=-116&state=Maine&state=California");
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: "Use state only once." });
});

for (const query of [
  "lat=0&lon=0&view=",
  "lat=0&lon=0&view=unknown",
  "lat=0&lon=0&view=Identity",
  "lat=0&lon=0&view=identity%20",
  "lat=0&lon=0&view=identity&view=identity",
  "lat=20",
  "lon=0",
  "lat=&lon=0",
  "lat=NaN&lon=0",
  "lat=0&lon=Infinity",
  "lat=91&lon=0",
  "lat=0&lon=-181",
  "lat=1&lat=2&lon=0",
  "lat=0&lon=0&lon=1",
  "lat=0&lon=0&limit=1&limit=2",
  "lat=0&lon=0&limit=0",
  "lat=0&lon=0&limit=1.5",
  "lat=0&lon=0&limit=7",
  "lat=0&lon=0&radius_km=",
  "lat=0&lon=0&radius_km=%20%20",
  "lat=0&lon=0&radius_km=0",
  "lat=0&lon=0&radius_km=-1",
  "lat=0&lon=0&radius_km=NaN",
  "lat=0&lon=0&radius_km=1km",
  "lat=0&lon=0&radius_km=Infinity",
  "lat=0&lon=0&radius_km=1&radius_km=1",
]) {
  test(`nearby rejects invalid query: ${query}`, async ({ request }) => {
    const response = await request.get(`/api/nearby?${query}`);
    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ error: expect.any(String) });
  });
}
