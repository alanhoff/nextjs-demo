import { expect, test } from "@playwright/test";
import { sites } from "../lib/catalog";

const west = sites.filter((site) => site.region === "West");
const cases = [
  { query: "", matches: sites },
  { query: "?state=Maine", matches: sites.filter((site) => site.state === "Maine") },
  {
    query: "?state=California&offset=1&limit=1",
    matches: sites.filter((site) => site.state === "California"),
    offset: 1,
    limit: 1,
  },
  ...["maine", "%20Maine%20", "", "Atlantis", "Maine&region=West", "Maine&q=Texas"].map(
    (value) => ({ query: `?state=${value}`, matches: [] }),
  ),
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

test("sites negotiates only a single text/csv preference", async ({ request }) => {
  const download = await request.get("/api/sites.csv");
  const csv = await request.get("/api/sites", { headers: { Accept: "TeXt/CsV" } });
  expect(csv.status()).toBe(200);
  expect(csv.headers()["content-type"]).toBe("text/csv; charset=utf-8");
  expect(await csv.body()).toEqual(await download.body());

  for (const Accept of ["application/json", "text/plain", "text/csv, application/json"]) {
    const response = await request.get("/api/sites", { headers: { Accept } });
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("application/json");
    expect(await response.json()).toEqual({ sites });
  }
});

for (const { query, matches, offset = 0, limit } of cases) {
  test(`sites renders the selected CSV rows for /api/sites${query}`, async ({ request }) => {
    const path = `/api/sites${query}`;
    const headers = { Accept: "text/csv" };
    const json = await request.get(path);
    const csv = await request.get(path, { headers });
    const head = await request.head(path, { headers });
    for (const response of [csv, head]) {
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toBe("text/csv; charset=utf-8");
      expect(response.headers()["x-total-count"]).toBe(json.headers()["x-total-count"]);
      expect(response.headers().link).toBe(json.headers().link);
    }
    const rows = matches.slice(offset, limit === undefined ? undefined : offset + limit);
    expect(await csv.text()).toBe(
      ["code,slug,name", ...rows.map(({ code, slug, name }) => `${code},${slug},${name}`), ""].join(
        "\r\n",
      ),
    );
    expect(await head.text()).toBe("");
  });
}

test("sites revalidates only the negotiated representation", async ({ request }) => {
  const path = "/api/sites?region=West&limit=2";
  const json = await request.get(path, { headers: { Accept: "application/json" } });
  const csv = await request.get(path, { headers: { Accept: "text/csv" } });
  expect(csv.headers().etag).not.toBe(json.headers().etag);
  const varyNames = (value = "") =>
    value.toLowerCase().split(",").map((name) => name.trim()).sort();
  expect(varyNames(csv.headers().vary)).toEqual(varyNames(json.headers().vary));

  for (const { Accept, selected, other } of [
    { Accept: "application/json", selected: json, other: csv },
    { Accept: "text/csv", selected: csv, other: json },
  ]) {
    const tag = selected.headers().etag;
    const vary = varyNames(selected.headers().vary);
    expect(tag).toMatch(/^W\/"[!#-~]+"$/);
    expect(vary).toContain("accept");
    for (const method of ["GET", "HEAD"]) {
      const matching = await request.fetch(path, {
        method,
        headers: { Accept, "If-None-Match": tag },
      });
      expect(matching.status()).toBe(304);
      expect(matching.headers().etag).toBe(tag);
      expect(varyNames(matching.headers().vary)).toEqual(vary);
      expect(await matching.text()).toBe("");

      const crossed = await request.fetch(path, {
        method,
        headers: { Accept, "If-None-Match": other.headers().etag },
      });
      expect(crossed.status()).toBe(200);
      expect(crossed.headers().etag).toBe(tag);
      expect(varyNames(crossed.headers().vary)).toEqual(vary);
      expect(await crossed.text()).toBe(method === "GET" ? await selected.text() : "");
    }
  }
});

test("sites revalidates the state-filtered CSV page for GET and HEAD", async ({ request }) => {
  const path = "/api/sites?state=California&limit=1";
  const headers = { Accept: "text/csv" };
  const csv = await request.get(path, { headers });
  expect(csv.status()).toBe(200);
  const tag = csv.headers().etag;
  expect(tag).toBeTruthy();
  expect(tag).not.toBe((await request.get(path)).headers().etag);
  for (const method of ["GET", "HEAD"]) {
    const cached = await request.fetch(path, { method, headers: { ...headers, "If-None-Match": tag } });
    expect(cached.status()).toBe(304);
    expect(cached.headers().etag).toBe(tag);
    expect(cached.headers()["x-total-count"]).toBe("2");
    expect(cached.headers().link).toBe('</api/sites?state=California&offset=1&limit=1>; rel="next"');
    expect(await cached.text()).toBe("");
  }
});

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
  {
    start: "/api/sites?state=California&region=wEsT&q=California&limit=1&view=summary",
    targets: ["/api/sites?q=California&region=wEsT&state=California&offset=1&limit=1&view=summary"],
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

test("sites validators are stable and specific to the selected JSON", async ({ request }) => {
  const tags = new Set<string>();
  for (const query of ["", "?view=summary", "?limit=4", "?limit=4&offset=4", "?region=West"]) {
    const path = `/api/sites${query}`;
    const get = await request.get(path);
    const tag = get.headers().etag;
    expect(get.status()).toBe(200);
    expect(tag).toMatch(/^W\/"[!#-~]+"$/);
    expect(get.headersArray().filter(({ name }) => name.toLowerCase() === "etag")).toHaveLength(1);
    expect(tags.has(tag)).toBe(false);
    tags.add(tag);
    expect((await request.get(path)).headers().etag).toBe(tag);
    const head = await request.head(path);
    expect(head.status()).toBe(200);
    expect(head.headers().etag).toBe(tag);
  }
});

test("sites revalidates GET and HEAD using complete weakly compared tags", async ({ request }) => {
  const path = "/api/sites?view=summary&limit=4&offset=4";
  const ordinary = await request.get(path);
  const tag = ordinary.headers().etag;
  const strong = tag.slice(2);
  const other = (await request.get("/api/sites?view=summary&limit=4")).headers().etag;
  const varyNames = (value = "") =>
    value.toLowerCase().split(",").map((name) => name.trim()).sort();

  for (const method of ["GET", "HEAD"]) {
    for (const value of [tag, strong, `"other,tag", ${strong}, W/"stale"`, "*"]) {
      const response = await request.fetch(path, { method, headers: { "If-None-Match": value } });
      expect(response.status()).toBe(304);
      expect(response.headers().etag).toBe(tag);
      expect(varyNames(response.headers().vary)).toEqual(varyNames(ordinary.headers().vary));
      expect(await response.text()).toBe("");
    }
    for (const value of [other, '"stale"', `${strong}suffix`, `${tag}, invalid`, `${tag}, *`]) {
      const response = await request.fetch(path, { method, headers: { "If-None-Match": value } });
      expect(response.status()).toBe(200);
      expect(response.headers().etag).toBe(tag);
      expect(await response.text()).toBe(method === "GET" ? await ordinary.text() : "");
    }
  }
});

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
  "state=Maine&state=Maine",
  "unexpected=1",
];

for (const query of invalidQueries) {
  test(`sites rejects ${query} for GET and HEAD`, async ({ request }) => {
    const path = `/api/sites?${query}`;
    const options = { headers: { Accept: "text/csv", "If-None-Match": "*" } };
    const get = await request.get(path, options);
    const head = await request.head(path, options);
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
