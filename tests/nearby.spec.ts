import { expect, test } from "@playwright/test";

test("nearby sites are ranked by distance from the catalog viewpoint", async ({ request }) => {
  const response = await request.get("/api/nearby?lat=34.011&lon=-116.168&limit=2");
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({
    sites: [
      { slug: "joshua-tree", distanceKm: 0 },
      { slug: "death-valley", distanceKm: 301 },
    ],
  });
});

test("nearby returns the full catalog by default", async ({ request }) => {
  const response = await request.get("/api/nearby?lat=44.330&lon=-68.184");
  expect(response.ok()).toBe(true);
  const { sites } = await response.json();
  expect(sites).toHaveLength(6);
  expect(sites[0]).toEqual({ slug: "acadia", distanceKm: 0 });
});

for (const query of [
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
]) {
  test(`nearby rejects invalid query: ${query}`, async ({ request }) => {
    const response = await request.get(`/api/nearby?${query}`);
    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ error: expect.any(String) });
  });
}
