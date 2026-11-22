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
    expect(body).toEqual({ error: "Supported parameters are lat, lon, limit, radius_km and view." });
    const advertisedNames = body.error
      .slice("Supported parameters are ".length, -1)
      .split(/, | and /);
    expect(advertisedNames.sort()).toEqual([...declaredNames].sort());
  }
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
