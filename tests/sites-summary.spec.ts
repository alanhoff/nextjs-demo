import { expect, test } from "@playwright/test";

test("sites summary counts the full catalog by state and region", async ({ request }) => {
  const response = await request.get("/api/sites/summary");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^application\/json(?:;|$)/);
  expect(await response.json()).toEqual({
    total: 6,
    byState: { California: 2, Maine: 1, Nevada: 1, Texas: 1, Utah: 1 },
    byRegion: { West: 3, Southwest: 2, Northeast: 1 },
  });

  const catalog = await request.get("/api/sites");
  expect(catalog.status()).toBe(200);
  const { sites } = await catalog.json();
  expect(sites).toHaveLength(6);
  expect(sites[0].slug).toBe("joshua-tree");
});

test("sites summary filters by exact state name", async ({ request }) => {
  const response = await request.get("/api/sites/summary?state=California");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({
    total: 2,
    byState: { California: 2 },
    byRegion: { West: 2 },
  });
});

for (const [query, summary] of [
  ["region=West", { total: 3, byState: { California: 2, Nevada: 1 }, byRegion: { West: 3 } }],
  ["region=Southwest&state=Texas", { total: 1, byState: { Texas: 1 }, byRegion: { Southwest: 1 } }],
  ["state=Maine&region=West", { total: 0, byState: {}, byRegion: {} }],
  ["state=california&region=West", { total: 0, byState: {}, byRegion: {} }],
] as const) {
  test(`sites summary applies region and optional state: ${query}`, async ({ request }) => {
    const response = await request.get(`/api/sites/summary?${query}`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(summary);
  });
}

for (const [query, parameter] of [
  ["regoin=West", "regoin"],
  ["extra=1", "extra"],
  ["state=California&extra=1", "extra"],
]) {
  test(`sites summary rejects unknown parameters: ${query}`, async ({ request }) => {
    const response = await request.get(`/api/sites/summary?${query}`);
    expect(response.status()).toBe(400);
    expect(response.headers()["content-type"]).toMatch(/^application\/json(?:;|$)/);
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect(await response.json()).toEqual({
      code: "unknown_parameter",
      parameter,
      error: `The ${parameter} parameter is not supported. Use state or region.`,
    });
  });
}

for (const [query, code] of [
  ["region=Atlantis", "invalid_filter_value"],
  ["region=west", "invalid_filter_value"],
  ["region=", "invalid_filter_value"],
  ["region=West&region=Northeast", "repeated_filter"],
  ["region=West&region=West", "repeated_filter"],
  ["region=&region=", "repeated_filter"],
]) {
  test(`sites summary rejects invalid region queries: ${query}`, async ({ request }) => {
    const response = await request.get(`/api/sites/summary?${query}`);
    expect(response.status()).toBe(400);
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect(await response.json()).toEqual({ code, parameter: "region", error: expect.stringMatching(/region/) });
  });
}

for (const query of [
  "state=California&state=Utah",
  "state=Maine&state=Maine",
  "state=&state=",
  "region=West&state=&state=",
]) {
  test(`sites summary rejects repeated state parameters: ${query}`, async ({ request }) => {
    const response = await request.get(`/api/sites/summary?${query}`);
    expect(response.status()).toBe(400);
    expect(response.headers()["content-type"]).toMatch(/^application\/json(?:;|$)/);
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect(await response.json()).toEqual({
      code: "repeated_filter",
      parameter: "state",
      error: "The state parameter may only be specified once.",
    });
  });
}

for (const state of ["Atlantis", "california", ""]) {
  test(`sites summary returns zero for state ${JSON.stringify(state)}`, async ({ request }) => {
    const response = await request.get(`/api/sites/summary?state=${state}`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ total: 0, byState: {}, byRegion: {} });
  });
}
