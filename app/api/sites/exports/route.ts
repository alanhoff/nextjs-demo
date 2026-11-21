export function GET() {
  return Response.json({
    catalog: "night-atlas",
    formats: [
      { id: "json", path: "/api/sites", media_type: "application/json" },
      { id: "csv", path: "/api/sites.csv", media_type: "text/csv" },
      { id: "geojson", path: "/api/sites.geojson", media_type: "application/geo+json" },
    ],
  });
}
