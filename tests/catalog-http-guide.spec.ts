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
  const revalidation = guide.split("## Revalidate the same representation")[1];
  expect(revalidation).toContain('page="$BASE_URL/api/sites?state=California&limit=1"');
  expect(revalidation).toContain("curl -sS -H 'Accept: text/csv' --etag-save catalog-page.etag");
  expect(revalidation).toContain(`-o catalog-page.csv -w 'HTTP %{http_code}\\n' "$page"`);
  expect(revalidation).toContain(
    `curl -i -H 'Accept: text/csv' --etag-compare catalog-page.etag "$page"`,
  );
  expect(revalidation).not.toContain("PASTE_CSV_TAG_HERE");
  expect(revalidation).toContain("304 Not Modified");
});

test("the guide's CSV page revalidates only with its own representation tag", async ({
  request,
}) => {
  const page = "/api/sites?state=California&limit=1";
  const headers = { Accept: "text/csv" };
  const csv = await request.get(page, { headers });
  expect(csv.status()).toBe(200);
  expect(csv.headers()["content-type"]).toBe("text/csv; charset=utf-8");
  const csvTag = csv.headers().etag;
  expect(csvTag).toMatch(/^W\/"[^"]+"$/);
  const body = await csv.text();
  expect(body).toMatch(/^code,slug,name\r?\n/);

  const unchanged = await request.get(page, {
    headers: { ...headers, "If-None-Match": csvTag },
  });
  expect(unchanged.status()).toBe(304);
  expect(await unchanged.text()).toBe("");

  const json = await request.get(page);
  expect(json.status()).toBe(200);
  const jsonTag = json.headers().etag;
  expect(jsonTag).toMatch(/^W\/"[^"]+"$/);
  expect(jsonTag).not.toBe(csvTag);
  const differentFormat = await request.get(page, {
    headers: { ...headers, "If-None-Match": jsonTag },
  });
  expect(differentFormat.status()).toBe(200);
  expect(differentFormat.headers().etag).toBe(csvTag);
  expect(await differentFormat.text()).toBe(body);
});
