import { expect, test } from "@playwright/test";

test("the catalog formats guide matches live export discovery", async ({ request }) => {
  const response = await request.get("/guides/catalog-formats.md");
  expect(response.status()).toBe(200);
  const guide = await response.text();
  expect(guide).toMatch(/^# Catalog export formats\r?\n/);

  const discovery = await request.get("/api/sites/exports");
  expect(discovery.status()).toBe(200);
  const { formats } = await discovery.json();
  expect(formats.length).toBeGreaterThan(0);

  const documented = Array.from(
    guide.matchAll(/^\| [^|]+ \| `([^`]+)` \| `([^`]+)` \|/gm),
    ([, path, media_type]) => ({ path, media_type }),
  );
  expect(documented).toHaveLength(formats.length);
  for (const { path, media_type } of formats) {
    expect(documented).toContainEqual({ path, media_type });
  }

test("the California example matches the live GeoJSON export", async ({ request }) => {
  const response = await request.get("/guides/catalog-formats.md");
  expect(response.status()).toBe(200);
  const guide = await response.text();
  const example = guide.match(/^## Map California sites\n([\s\S]*?)^```text\n([\s\S]*?)\n```$/m);
  expect(example?.[1]).toContain(
    "```sh\ncurl -fsS \"$BASE_URL/api/sites.geojson?state=California\" | jq -r '.features[] | [.properties.code, .geometry.coordinates[]] | @tsv'\n```",
  );

  const geojson = await request.get("/api/sites.geojson?state=California");
  expect(geojson.status()).toBe(200);
  expect(geojson.headers()["content-type"]).toBe("application/geo+json");
  const { type, features } = await geojson.json();
  expect(type).toBe("FeatureCollection");
  expect(features).toHaveLength(2);
  const rows = features.map(
    ({ properties, geometry }: { properties: { code: string }; geometry: { coordinates: number[] } }) =>
      [properties.code, ...geometry.coordinates].join("\t"),
  );
  expect(example?.[2]).toBe(rows.join("\n"));
});
});
