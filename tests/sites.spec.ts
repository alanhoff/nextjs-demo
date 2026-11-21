import { expect, test } from "@playwright/test";
import { sites } from "../lib/catalog";

const west = sites.filter((site) => site.region === "West");
const cases = [
  { query: "", matches: sites },
  { query: "?region=West&limit=1", matches: west, limit: 1 },
  {
    query: "?region=West&q=california&limit=1",
    matches: west.filter((site) => site.state === "California"),
    limit: 1,
  },
  { query: "?q=does-not-exist-000019", matches: [] },
];

for (const { query, matches, limit } of cases) {
  test(`sites reports the total before limiting for /api/sites${query}`, async ({ request }) => {
    const path = `/api/sites${query}`;
    const get = await request.get(path);
    expect(get.status()).toBe(200);
    expect(get.headers()["x-total-count"]).toBe(String(matches.length));
    expect(await get.json()).toEqual({ sites: matches.slice(0, limit) });

    const head = await request.head(path);
    expect(head.status()).toBe(200);
    expect(head.headers()["x-total-count"]).toBe(String(matches.length));
    expect(await head.text()).toBe("");
  });
}

test("sites rejects an invalid limit for GET and HEAD", async ({ request }) => {
  const path = "/api/sites?limit=0";
  expect((await request.get(path)).status()).toBe(400);
  const head = await request.head(path);
  expect(head.status()).toBe(400);
  expect(await head.text()).toBe("");
});
