import { expect, test } from "@playwright/test";

test("sites summary counts the full catalog by state", async ({ request }) => {
  const response = await request.get("/api/sites/summary");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^application\/json(?:;|$)/);
  expect(await response.json()).toEqual({
    total: 6,
    byState: { California: 2, Maine: 1, Nevada: 1, Texas: 1, Utah: 1 },
  });

  const catalog = await request.get("/api/sites");
  expect(catalog.status()).toBe(200);
  const { sites } = await catalog.json();
  expect(sites).toHaveLength(6);
  expect(sites[0].slug).toBe("joshua-tree");
});
