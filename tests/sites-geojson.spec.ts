import { expect, test } from "@playwright/test";
import { sites } from "../lib/catalog";

test("sites GeoJSON maps the complete catalog to points in order", async ({ request }) => {
  const response = await request.get("/api/sites.geojson");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^application\/geo\+json(?:;|$)/);

  expect(await response.json()).toEqual({
    type: "FeatureCollection",
    features: sites.map(({ code, slug, name, coordinates }) => {
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
  });
});
