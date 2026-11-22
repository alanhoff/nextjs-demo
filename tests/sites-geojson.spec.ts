import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import { sites } from "../lib/catalog";

function featureCollection(selectedSites: typeof sites) {
  return {
    type: "FeatureCollection",
    features: selectedSites.map(({ code, slug, name, coordinates }) => {
      const [latitude, longitude] = coordinates.split(",").map((coordinate) => {
        const [degrees, hemisphere] = coordinate.trim().split("° ");
        return Number(degrees) * (hemisphere === "S" || hemisphere === "W" ? -1 : 1);
      });
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [longitude, latitude] },
        properties: { code, slug, name },
      };
    }),
  };
}

test("sites GeoJSON maps the complete catalog to points in order", async ({ request }) => {
  const response = await request.get("/api/sites.geojson");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/geo+json");
  expect(await response.json()).toEqual(featureCollection(sites));
  expect(createHash("sha256").update(await response.body()).digest("hex")).toBe(
    "e71e833e794d12663a9e5a9a56b20730ac5ac7fabd3b6906fa2165bdfe519e42",
  );
});

for (const [query, codes] of [
  ["state=Maine", ["ACAD"]],
  ["region=West&state=California", ["JOTR", "DEVA"]],
  ["region=Northeast&state=Texas", []],
  ["state=Maine&region=West&region=Northeast&q=ignored", ["ACAD"]],
  ["state=", []],
  ["state=Atlantis", []],
  ["state=maine", []],
  ["state=%20Maine%20", []],
] as const) {
  test(`standalone exports filter sites for ${query}`, async ({ request }) => {
    const selected = sites.filter(({ code }) => codes.some((expected) => expected === code));
    const csv = await request.get(`/api/sites.csv?${query}`);
    expect(csv.status()).toBe(200);
    expect(csv.headers()["content-type"]).toBe("text/csv; charset=utf-8");
    expect(csv.headers()["content-disposition"]).toBe('attachment; filename="sites.csv"');
    expect(await csv.text()).toBe(
      ["code,slug,name", ...selected.map(({ code, slug, name }) => `${code},${slug},${name}`), ""].join(
        "\r\n",
      ),
    );

    const geojson = await request.get(`/api/sites.geojson?${query}`);
    expect(geojson.status()).toBe(200);
    expect(geojson.headers()["content-type"]).toBe("application/geo+json");
    expect(await geojson.json()).toEqual(featureCollection(selected));
  });
}

for (const format of ["csv", "geojson"]) {
  test(`sites ${format} rejects repeated state`, async ({ request }) => {
    const response = await request.get(`/api/sites.${format}?state=Maine&state=Maine`);
    expect(response.status()).toBe(400);
    expect(response.headers()["content-type"]).toBe("application/json");
    expect(await response.json()).toEqual({ error: "Use the state filter only once." });
  });
}

for (const [query, region] of [
  ["West", "West"],
  ["%20sOuThWeSt%20", "Southwest"],
  ["Atlantis", "Atlantis"],
]) {
  test(`sites GeoJSON returns only features for region ${query}`, async ({ request }) => {
    const response = await request.get(`/api/sites.geojson?region=${query}`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("application/geo+json");
    expect(await response.json()).toEqual(
      featureCollection(sites.filter((site) => site.region === region)),
    );
  });
}
