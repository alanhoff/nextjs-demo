import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const exportedFunction = /^export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/;
const methods = /^(GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS|TRACE)$/;

function handlerInventory(directory = "app/api", route = "/api"): [string, string[]][] {
  return readdirSync(directory, { withFileTypes: true }).flatMap<[string, string[]]>((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return handlerInventory(path, `${route}/${entry.name}`);
    if (entry.name !== "route.ts") return [];

    const source = readFileSync(path, "utf8");
    const exported = Array.from(source.matchAll(/^\s*export\b[^\S\r\n]*[^\r\n]*/gm), ([declaration]) => {
      const match = exportedFunction.exec(declaration.trimStart());
      if (!match) throw new Error(`Unsupported route export in ${path}: ${declaration.trim()}`);
      return match[1];
    });
    const httpMethods = exported.filter((method) => methods.test(method));
    if (httpMethods.length === 0) throw new Error(`No explicit HTTP method exports found in ${path}`);
    return [[route, httpMethods.map((method) => method.toLowerCase()).sort()]];
  });
}

test("published OpenAPI describes exactly the explicit API handlers", async ({ request }) => {
  const response = await request.get("/openapi.json");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^application\/json(?:;|$)/);
  const spec = await response.json();
  expect(spec.openapi).toBe("3.1.1");
  expect(Object.fromEntries(Object.entries(spec.paths).map(([path, operations]) => [path, Object.keys(operations as object).sort()]))).toEqual(Object.fromEntries(handlerInventory()));

  const catalog = spec.paths["/api/sites"];
  for (const method of ["get", "head"]) {
    expect(catalog[method].parameters[6]).toEqual({ $ref: "#/components/parameters/CatalogState" });
  }
  expect(spec.components.parameters.CatalogState).toEqual({
    name: "state",
    in: "query",
    required: false,
    description:
      "Exact, case-sensitive state name without trimming. Omit to match any state. Empty, unknown, wrong-case, or padded values match no sites. Specify at most once.",
    schema: { type: "string" },
  });
  expect(Object.keys(catalog.get.responses["200"].content).sort()).toEqual(["application/json", "text/csv"]);
  expect(catalog.get.responses["304"]).not.toHaveProperty("content");
  expect(Object.keys(catalog.head.responses).sort()).toEqual(["200", "304", "400"]);
  for (const status of ["200", "304", "400"]) {
    expect(catalog.head.responses[status]).not.toHaveProperty("content");
  }
  expect(spec.paths["/api/nearby"].get.parameters.filter(({ required }: { required: boolean }) => required).map(({ name }: { name: string }) => name)).toEqual(["lat", "lon"]);
  expect(spec.paths["/api/nearby"].get.parameters[3]).toMatchObject({
    name: "radius_km",
    in: "query",
    required: false,
    schema: { type: "number", exclusiveMinimum: 0 },
  });
  expect(spec.components.schemas.NearbySite.required).toEqual(["slug", "distanceKm"]);
  expect(spec.components.schemas.CatalogSummary.required).toEqual(["total", "byState", "byRegion"]);
  expect(spec.paths["/api/sites/summary"].get.responses["400"].content["application/json"].schema.$ref).toBe("#/components/schemas/FilterError");
  for (const path of ["/api/sites.csv", "/api/sites.geojson"]) {
    expect(spec.paths[path].get.parameters).toEqual([{ $ref: "#/components/parameters/ExportRegion" }]);
    expect(Object.keys(spec.paths[path].get.responses)).toEqual(["200"]);
  }
  expect(spec.components.parameters.ExportRegion).toMatchObject({ style: "form", explode: true, schema: { type: "array" } });
});

test("published OpenAPI gives every explicit handler a stable, unique operation ID", async ({ request }) => {
  const response = await request.get("/openapi.json");
  expect(response.status()).toBe(200);
  const spec = await response.json();

  const operationIds = Object.fromEntries(handlerInventory().flatMap(([path, httpMethods]) =>
    httpMethods.map((method) => [`${method.toUpperCase()} ${path}`, spec.paths[path]?.[method]?.operationId]),
  ));
  expect(operationIds).toStrictEqual({
    "GET /api/nearby": "getNearbySites",
    "GET /api/sites": "listSites",
    "HEAD /api/sites": "headSites",
    "GET /api/sites.csv": "exportSitesCsv",
    "GET /api/sites.geojson": "exportSitesGeoJson",
    "GET /api/sites/exports": "listSiteExports",
    "GET /api/sites/status": "getSiteStatus",
    "GET /api/sites/summary": "getSiteSummary",
  });
  const ids = Object.values(operationIds);
  for (const id of ids) expect(id).toMatch(/\S/);
  expect(new Set(ids).size).toBe(ids.length);
});

test("published OpenAPI groups every explicit handler by purpose", async ({ request }) => {
  const response = await request.get("/openapi.json");
  expect(response.status()).toBe(200);
  const spec = await response.json();

  expect(spec.tags).toStrictEqual([
    { name: "Catalog", description: "Browse the site catalog, inspect its response headers, and check catalog status." },
    { name: "Discovery", description: "Find nearby observing sites and summarize matching sites by state or region." },
    { name: "Exports", description: "Discover export formats and download the catalog as CSV or GeoJSON." },
  ]);

  const operationTags = Object.fromEntries(handlerInventory().flatMap(([path, httpMethods]) =>
    httpMethods.map((method) => [`${method.toUpperCase()} ${path}`, spec.paths[path]?.[method]?.tags]),
  ));
  expect(operationTags).toStrictEqual({
    "GET /api/nearby": ["Discovery"],
    "GET /api/sites": ["Catalog"],
    "HEAD /api/sites": ["Catalog"],
    "GET /api/sites.csv": ["Exports"],
    "GET /api/sites.geojson": ["Exports"],
    "GET /api/sites/exports": ["Exports"],
    "GET /api/sites/status": ["Catalog"],
    "GET /api/sites/summary": ["Discovery"],
  });
});

test("published search constraints match the handlers' trimmed UTF-16 limit", async ({ request }) => {
  const response = await request.get("/openapi.json");
  expect(response.status()).toBe(200);
  const spec = await response.json();
  const schema = spec.components.parameters.Search.schema as {
    pattern: string;
    allOf?: { pattern: string }[];
  };
  const patterns = [schema, ...(schema.allOf ?? [])].map(({ pattern }) => new RegExp(pattern, "u"));

  for (const [text, status] of [
    ["😀".repeat(40), 200],
    ["😀".repeat(41), 400],
    [`${"a".repeat(78)}😀`, 200],
    [`${"a".repeat(78)} 😀`, 400],
    ["a".repeat(81), 400],
  ] as const) {
    const q = `\t ${text} \u00a0`;
    expect(patterns.every((pattern) => pattern.test(q)), `schema for ${text}`).toBe(status === 200);
    for (const path of ["/api/sites", "/api/sites/summary"]) {
      const result = await request.get(path, { params: { q } });
      expect(result.status(), `${path} for ${text}`).toBe(status);
    }
  }
});
