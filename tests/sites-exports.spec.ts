import { expect, test } from "@playwright/test";

test("sites export discovery advertises working catalog formats in order", async ({ request }) => {
  const response = await request.get("/api/sites/exports");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/json");

  const discovery = await response.json();
  expect(discovery).toEqual({
    catalog: "night-atlas",
    formats: [
      { id: "json", path: "/api/sites", media_type: "application/json" },
      { id: "csv", path: "/api/sites.csv", media_type: "text/csv" },
      { id: "geojson", path: "/api/sites.geojson", media_type: "application/geo+json" },
    ],
  });

  for (const { path, media_type } of discovery.formats) {
    const exported = await request.get(path, { maxRedirects: 0 });
    expect(exported.status(), path).toBe(200);
    expect(exported.headers()["content-type"]?.split(";")[0], path).toBe(media_type);
  }
});
