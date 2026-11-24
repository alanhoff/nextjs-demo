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
});

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

const guidePath = "/guides/catalog-formats.md";

test("the California streaming example matches the live NDJSON export", async ({ request }) => {
  const response = await request.get(guidePath);
  expect(response.status()).toBe(200);
  const guide = await response.text();
  expect(guide).not.toContain("NDJSON always returns the full catalog and ignores query filters.");
  const example = guide.match(/^## Stream California sites\n([\s\S]*?)^```text\n([\s\S]*?)\n```$/m);
  expect(example?.[1]).toContain(
    "Omit `state` to stream the entire catalog. Supply one exact, case-sensitive state name to stream only that state's sites. An unmatched or empty `state` returns no records. Repeating `state` is rejected.",
  );
  const path = "/api/sites.ndjson?state=California";
  expect(example?.[1]).toContain(`\`\`\`sh\ncurl -fsS "$BASE_URL${path}" | jq -r '.code'\n\`\`\``);

  const ndjson = await request.get(path);
  expect(ndjson.status()).toBe(200);
  expect(ndjson.headers()["content-type"]).toBe("application/x-ndjson");
  const lines = (await ndjson.text()).split("\n");
  expect(lines.pop()).toBe("");
  const records = lines.map((line) => JSON.parse(line));
  expect(records.map(({ state }) => state)).toEqual(["California", "California"]);
  const codes = records.map(({ code }) => code);
  expect(codes).toEqual(["JOTR", "DEVA"]);
  expect(example?.[2]).toBe(codes.join("\n"));
});

test("the full guide ignores tracking parameters and supports HEAD", async ({ request }) => {
  const full = await request.get(guidePath);
  const tracked = await request.get(`${guidePath}?utm_source=atlas`);
  for (const response of [full, tracked]) {
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^text\/markdown\b/);
  }
  expect(await tracked.body()).toEqual(await full.body());

  const head = await request.head(guidePath);
  expect(head.status()).toBe(200);
  expect(head.headers()["content-type"]).toMatch(/^text\/markdown\b/);
  expect(await head.body()).toHaveLength(0);
});

for (const [format, path] of Object.entries({
  json: "/api/sites",
  csv: "/api/sites.csv",
  geojson: "/api/sites.geojson",
  ndjson: "/api/sites.ndjson",
})) {
  test(`the ${format} guide includes only its original table row`, async ({ request }) => {
    const full = await (await request.get(guidePath)).text();
    const row = full.split("\n").find((line) => line.includes(`| \`${path}\` |`));
    expect(row).toBeDefined();

    const response = await request.get(`${guidePath}?format=${format}`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^text\/markdown\b/);
    const table = (await response.text()).split("\n").filter((line) => line.startsWith("|"));
    expect(table).toEqual(["| Use case | Path | Media type | Response shape |", "| --- | --- | --- | --- |", row]);
  });
}

for (const query of ["format=", "format=unknown", "format=JSON", "format=json&format=csv", "format=json&format=json"]) {
  test(`the catalog formats guide rejects ${query}`, async ({ request }) => {
    expect((await request.get(`${guidePath}?${query}`)).status()).toBe(400);
  });
}
