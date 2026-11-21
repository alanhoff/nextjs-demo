import { expect, test } from "@playwright/test";

test("returns the nearest observing sites in whole kilometers", async ({ request }) => {
  const response = await request.get("/api/nearby?lat=34.011&lon=-116.168&limit=2");
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({
    sites: [
      { slug: "joshua-tree", distanceKm: 0 },
      { slug: "death-valley", distanceKm: 301 },
    ],
  });
});

test("defaults to the whole catalog with Acadia first at Sand Beach", async ({ request }) => {
  const response = await request.get("/api/nearby?lat=44.330&lon=-68.184");
  expect(response.ok()).toBe(true);
  const { sites } = await response.json();
  expect(sites).toHaveLength(6);
  expect(sites[0]).toEqual({ slug: "acadia", distanceKm: 0 });
});

for (const query of [
  "lat=20",
  "lat=91&lon=0",
  "lat=0&lon=Infinity",
  "lat=1&lat=2&lon=0",
  "lat=0&lon=0&lon=1",
  "lat=0&lon=0&limit=1&limit=2",
  "lat=0&lon=0&limit=0",
  "lat=0&lon=0&limit=1.5",
  "lat=0&lon=0&limit=7",
]) {
  test(`rejects invalid nearby query: ${query}`, async ({ request }) => {
    const response = await request.get(`/api/nearby?${query}`);
    expect(response.status()).toBe(400);
  });
}
