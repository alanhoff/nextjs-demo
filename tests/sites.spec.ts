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

const summarize = ({ description, notes, ...site }: (typeof sites)[number]) => site;

for (const { start, targets, matches, limit, summary = false } of [
  {
    start: "/api/sites?limit=2&q=%20",
    targets: ["/api/sites?offset=2&limit=2", "/api/sites?offset=4&limit=2"],
    matches: sites,
    limit: 2,
  },
  {
    start: "/api/sites?limit=1&region=West&q=%43alifornia",
    targets: ["/api/sites?q=California&region=West&offset=1&limit=1"],
    matches: west.filter((site) => site.state === "California"),
    limit: 1,
  },
  {
    start: "/api/sites?view=summary&limit=1&region=West&q=%43alifornia",
    targets: ["/api/sites?q=California&region=West&offset=1&limit=1&view=summary"],
    matches: west.filter((site) => site.state === "California"),
    limit: 1,
    summary: true,
  },
]) {
  test(`sites follows next links from ${start}`, async ({ request }) => {
    let path = start;
    for (const [page, target] of [...targets, undefined].entries()) {
      const get = await request.get(path);
      const head = await request.head(path);
      const link = target ? `<${target}>; rel="next"` : undefined;
      for (const response of [get, head]) {
        expect(response.status()).toBe(200);
        expect(response.headers()["x-total-count"]).toBe(String(matches.length));
        expect(response.headers()["link"]).toBe(link);
      }
      const records = matches.slice(page * limit, (page + 1) * limit);
      expect(await get.json()).toEqual({ sites: summary ? records.map(summarize) : records });
      expect(await head.text()).toBe("");
      if (target) path = get.headers()["link"].split(">", 1)[0].slice(1);
    }
  });
}

for (const { query, matches } of [
  { query: "", matches: sites },
  { query: "&q=Hidden%20Valley", matches: sites.filter((site) => site.viewpoint === "Hidden Valley") },
  { query: "&q=does-not-exist-000019", matches: [] },
]) {
  test(`sites projects the catalog for view=summary${query}`, async ({ request }) => {
    const get = await request.get(`/api/sites?view=summary${query}`);
    expect(get.status()).toBe(200);
    expect(get.headers()["x-total-count"]).toBe(String(matches.length));
    expect(get.headers()["link"]).toBeUndefined();
    expect(await get.json()).toEqual({ sites: matches.map(summarize) });
  });
}

const invalidQueries = [
  "view=",
  "view=unknown",
  "view=Summary",
  "view=summary&view=summary",
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
    const get = await request.get(path);
    const head = await request.head(path);
    for (const response of [get, head]) {
      expect(response.status()).toBe(400);
      expect(response.headers()["content-type"]).toContain("application/json");
      expect(response.headers()["link"]).toBeUndefined();
      expect(response.headers()["x-total-count"]).toBeUndefined();
    }
    expect(await get.json()).toEqual({ error: expect.any(String) });
    expect(await head.text()).toBe("");
  });
}
