import { getSites } from "@/lib/catalog";

function signedDegrees(coordinate: string) {
  const degrees = Number.parseFloat(coordinate);
  return /[SW]$/.test(coordinate) ? -degrees : degrees;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.getAll("state").length > 1) {
    return Response.json({ error: "Use the state filter only once." }, { status: 400 });
  }
  const state = searchParams.get("state");
  const regions = searchParams.getAll("region");
  const region = regions.length === 1 ? regions[0].trim().toLowerCase() : undefined;
  const sites = await getSites();
  const matchingSites = sites.filter(
    (site) =>
      (state === null || site.state === state) &&
      (region === undefined || site.region.toLowerCase() === region),
  );
  const features = matchingSites.map(({ code, slug, name, coordinates }) => {
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
