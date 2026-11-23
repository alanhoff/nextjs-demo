const introduction = `# Catalog export formats

Use \`GET /api/sites/exports\` to discover the available formats. The JSON manifest lists each format's \`id\`, \`path\`, and \`media_type\`. Set \`BASE_URL\` to your Night Atlas origin without a trailing slash, then run:

\`\`\`sh
curl -fsS "$BASE_URL/api/sites/exports"
\`\`\`

| Use case | Path | Media type | Response shape |
| --- | --- | --- | --- |
`;

const rows = new Map([
  ["json", "| Records for an app | `/api/sites` | `application/json` | A JSON object with a `sites` array of site records. |"],
  ["csv", "| Spreadsheets | `/api/sites.csv` | `text/csv` | A UTF-8 CSV table with the header `code,slug,name` and one row per site. The response sends `text/csv; charset=utf-8`. |"],
  ["geojson", "| Maps and GIS | `/api/sites.geojson` | `application/geo+json` | A `FeatureCollection` with one `Point` feature per site. Coordinates are ordered longitude then latitude; properties contain `code`, `slug`, and `name`. |"],
  ["ndjson", "| Streaming or line-by-line processing | `/api/sites.ndjson` | `application/x-ndjson` | One full site object per line, with an LF after each record, including the last. There is no enclosing array. |"],
]);

const fullGuide = `${introduction}${Array.from(rows.values()).join("\n")}

## Map California sites

Use \`curl\` and \`jq\` to print three tab-separated fields in this order: site code, longitude, latitude.

\`\`\`sh
curl -fsS "$BASE_URL/api/sites.geojson?state=California" | jq -r '.features[] | [.properties.code, .geometry.coordinates[]] | @tsv'
\`\`\`

\`\`\`text
JOTR\t-116.168\t34.011
DEVA\t-117.116\t36.607
\`\`\`

Query options differ by route. JSON supports \`q\`, \`region\`, and \`state\` filters, \`limit\` and \`offset\` for paging, and \`view=summary\` for shorter records. The standalone CSV and GeoJSON routes filter by \`state\` and \`region\`, but do not support paging. NDJSON always returns the full catalog and ignores query filters.
`;

export function GET(request: Request) {
  const formats = new URL(request.url).searchParams.getAll("format");
  const headers = { "Content-Type": "text/markdown; charset=utf-8" };
  if (formats.length === 0) return new Response(fullGuide, { headers });

  const row = formats.length === 1 ? rows.get(formats[0]) : undefined;
  if (!row) {
    return new Response("Supply exactly one format: json, csv, geojson, or ndjson.\n", {
      status: 400,
      headers,
    });
  }

  return new Response(`${introduction}${row}\n`, { headers });
}
