import { expect, test } from "@playwright/test";

test("publishes the catalog HTTP client guide", async ({ request }) => {
  const response = await request.get("/guides/catalog-http.md");
  expect(response.status()).toBe(200);

  const guide = await response.text();
  expect(guide).toMatch(/^# Catalog HTTP guide\r?\n/);
  expect(guide).toContain("/api/sites?state=California&limit=1");
  expect(guide).toContain("X-Total-Count: 2");
  expect(guide).toContain('Link: </api/sites?state=California&offset=1&limit=1>; rel="next"');
  expect(guide).toContain("curl -I");
  expect(guide).toContain("Accept: text/csv");
  expect(guide).toContain("If-None-Match:");
  expect(guide).toContain("304 Not Modified");
});
