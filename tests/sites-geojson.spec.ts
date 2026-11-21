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
