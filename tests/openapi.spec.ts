import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import ts from "typescript";

const methods = /^(GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS|TRACE)$/;

function handlerInventory(directory = "app/api", route = "/api"): [string, string[]][] {
  return readdirSync(directory, { withFileTypes: true }).flatMap<[string, string[]]>((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return handlerInventory(path, `${route}/${entry.name}`);
    if (entry.name !== "route.ts") return [];

    const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
    const exported = source.statements.flatMap((statement) => {
      if (ts.isExportDeclaration(statement) && !statement.isTypeOnly && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        return statement.exportClause.elements.filter((element) => !element.isTypeOnly).map((element) => element.name.text);
      }
      if (!ts.canHaveModifiers(statement) || !ts.getModifiers(statement)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) return [];
      if (ts.isFunctionDeclaration(statement) && statement.name) return [statement.name.text];
      if (ts.isVariableStatement(statement)) return statement.declarationList.declarations.flatMap(({ name }) => ts.isIdentifier(name) ? [name.text] : []);
      return [];
    });
    return [[route, exported.filter((method) => methods.test(method)).map((method) => method.toLowerCase()).sort()]];
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
  expect(Object.keys(catalog.get.responses["200"].content).sort()).toEqual(["application/json", "text/csv"]);
  expect(catalog.get.responses["304"]).not.toHaveProperty("content");
  expect(Object.keys(catalog.head.responses).sort()).toEqual(["200", "304", "400"]);
  for (const status of ["200", "304", "400"]) {
    expect(catalog.head.responses[status]).not.toHaveProperty("content");
  }
  expect(spec.paths["/api/nearby"].get.parameters.filter(({ required }: { required: boolean }) => required).map(({ name }: { name: string }) => name)).toEqual(["lat", "lon"]);
  expect(spec.components.schemas.NearbySite.required).toEqual(["slug", "distanceKm"]);
  expect(spec.components.schemas.CatalogSummary.required).toEqual(["total", "byState", "byRegion"]);
  expect(spec.paths["/api/sites/summary"].get.responses["400"].content["application/json"].schema.$ref).toBe("#/components/schemas/FilterError");
  for (const path of ["/api/sites.csv", "/api/sites.geojson"]) {
    expect(spec.paths[path].get.parameters).toEqual([{ $ref: "#/components/parameters/ExportRegion" }]);
    expect(Object.keys(spec.paths[path].get.responses)).toEqual(["200"]);
  }
  expect(spec.components.parameters.ExportRegion).toMatchObject({ style: "form", explode: true, schema: { type: "array" } });
});
