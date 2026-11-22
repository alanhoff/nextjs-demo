import { expect, test } from "@playwright/test";

test("sites export discovery advertises working catalog formats", async ({ request }) => {
  const response = await request.get("/api/sites/exports");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/json");

  const discovery = await response.json();
  expect(discovery.catalog).toBe("night-atlas");
  for (const descriptor of [
    { id: "json", path: "/api/sites", media_type: "application/json" },
    { id: "csv", path: "/api/sites.csv", media_type: "text/csv" },
    { id: "geojson", path: "/api/sites.geojson", media_type: "application/geo+json" },
    { id: "ndjson", path: "/api/sites.ndjson", media_type: "application/x-ndjson" },
  ]) {
    expect(discovery.formats).toContainEqual(descriptor);
  }

  for (const { path, media_type } of discovery.formats) {
    const exported = await request.get(path, { maxRedirects: 0 });
    expect(exported.status(), path).toBe(200);
    expect(exported.headers()["content-type"]?.split(";")[0], path).toBe(media_type);
  }
});

for (const [format, otherFormat] of [["csv", "geojson"], ["geojson", "csv"]]) {
  test(`standalone ${format} revalidates only the selected export`, async ({ request }) => {
    const endpoint = `/api/sites.${format}`;
    const path = `${endpoint}?state=Maine`;
    const original = await request.get(path);
    expect(original.status()).toBe(200);
    const tag = original.headers().etag;
    expect(tag).toMatch(/^W\/"[!#-~]+"$/);

    const conditional = (url: string, validator: string) =>
      request.get(url, { headers: { "If-None-Match": validator } });
    for (const [url, validator] of [
      [path, tag],
      [path, tag],
      [path, tag.slice(2)],
      [path, `"stale,tag", ${tag}`],
      [path, "*"],
      [`${path}&region=Northeast`, tag],
    ]) {
      const response = await conditional(url, validator);
      expect(response.status(), `${url}: ${validator}`).toBe(304);
      expect(response.headers().etag).toBe(tag);
      expect(await response.text()).toBe("");
    }

    const different = await request.get(`${endpoint}?state=California`);
    expect(different.status()).toBe(200);
    expect(await different.text()).not.toBe(await original.text());
    const other = await request.get(`/api/sites.${otherFormat}?state=Maine`);
    expect(other.status()).toBe(200);
    for (const validator of [different.headers().etag, other.headers().etag]) {
      expect(validator).toBeTruthy();
      expect(validator).not.toBe(tag);
      const response = await conditional(path, validator);
      expect(response.status()).toBe(200);
      expect(response.headers().etag).toBe(tag);
      expect(response.headers()["content-type"]).toBe(original.headers()["content-type"]);
      expect(await response.body()).toEqual(await original.body());
    }

    const invalid = await conditional(`${path}&state=Texas`, "*");
    expect(invalid.status()).toBe(400);
    expect(invalid.headers()["content-type"]).toBe("application/json");
    expect(invalid.headers().etag).toBeUndefined();
    expect(await invalid.json()).toEqual({ error: "Use the state filter only once." });
  });
}
