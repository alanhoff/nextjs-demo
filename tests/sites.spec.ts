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
  { query: "?limit=2", matches: sites, limit: 2 },
  { query: "?offset=0&limit=2", matches: sites, offset: 0, limit: 2 },
  { query: "?offset=2&limit=2", matches: sites, offset: 2, limit: 2 },
  { query: "?region=West&offset=1&limit=1", matches: west, offset: 1, limit: 1 },
  {
    query: "?region=West&q=california&offset=1&limit=1",
    matches: west.filter((site) => site.state === "California"),
    offset: 1,
    limit: 1,
  },
  { query: "?offset=4", matches: sites, offset: 4 },
  { query: `?offset=${sites.length}`, matches: sites, offset: sites.length },
  {
    query: `?offset=${Number.MAX_SAFE_INTEGER}&limit=2`,
    matches: sites,
    offset: Number.MAX_SAFE_INTEGER,
    limit: 2,
  },
];

for (const { query, matches, offset = 0, limit } of cases) {
  test(`sites reports the total before paging for /api/sites${query}`, async ({ request }) => {
    const path = `/api/sites${query}`;
    const get = await request.get(path);
    expect(get.status()).toBe(200);
    expect(get.headers()["x-total-count"]).toBe(String(matches.length));
    const end = limit === undefined ? undefined : offset + limit;
    expect(await get.json()).toEqual({ sites: matches.slice(offset, end) });

    const head = await request.head(path);
    expect(head.status()).toBe(200);
    expect(head.headers()["x-total-count"]).toBe(String(matches.length));
    expect(await head.text()).toBe("");
  });
}

const invalidQueries = [
  "limit=0",
  "offset=-1",
  "offset=1.5",
  "offset=",
  "offset=abc",
  "offset=1&offset=1",
  "offset=9007199254740992",
  "offset=1&limit=0",
  "offset=1&region=Unknown",
  `offset=1&q=${"a".repeat(81)}`,
  "offset=1&q=California&q=Nevada",
];

for (const query of invalidQueries) {
  test(`sites rejects ${query} for GET and HEAD`, async ({ request }) => {
    const path = `/api/sites?${query}`;
    expect((await request.get(path)).status()).toBe(400);
    const head = await request.head(path);
    expect(head.status()).toBe(400);
    expect(await head.text()).toBe("");
  });
}
