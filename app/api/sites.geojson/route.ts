import { getSites } from "@/lib/catalog";

function signedDegrees(coordinate: string) {
  const degrees = Number.parseFloat(coordinate);
  return /[SW]$/.test(coordinate) ? -degrees : degrees;
}

export async function GET() {
  const features = (await getSites()).map(({ code, slug, name, coordinates }) => {
    const [latitude, longitude] = coordinates.split(", ").map(signedDegrees);
    return {
      type: "Feature",
      geometry: { type: "Point", coordinates: [longitude, latitude] },
      properties: { code, slug, name },
    };
  });

  return Response.json(
    { type: "FeatureCollection", features },
    { headers: { "Content-Type": "application/geo+json" } },
  );
}
