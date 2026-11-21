import { getSites } from "@/lib/catalog";

const earthRadiusKm = 6371;
const radians = (degrees: number) => (degrees * Math.PI) / 180;

function signedDegrees(coordinate: string) {
  const degrees = Number.parseFloat(coordinate);
  return /[SW]$/.test(coordinate) ? -degrees : degrees;
}

function distanceKm(lat: number, lon: number, coordinates: string) {
  const [siteLat, siteLon] = coordinates.split(", ").map(signedDegrees);
  const haversine =
    Math.sin(radians(siteLat - lat) / 2) ** 2 +
    Math.cos(radians(lat)) *
      Math.cos(radians(siteLat)) *
      Math.sin(radians(siteLon - lon) / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(Math.min(1, haversine)));
}

function coordinate(value: string | null, max: number) {
  const degrees = value?.trim() ? Number(value) : NaN;
  return Number.isFinite(degrees) && Math.abs(degrees) <= max ? degrees : null;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  for (const key of params.keys()) {
    if (key !== "lat" && key !== "lon" && key !== "limit") {
      return Response.json({ error: "Supported parameters are lat, lon and limit." }, { status: 400 });
    }
    if (params.getAll(key).length > 1) {
      return Response.json({ error: `Use ${key} only once.` }, { status: 400 });
    }
  }

  const lat = coordinate(params.get("lat"), 90);
  const lon = coordinate(params.get("lon"), 180);
  if (lat === null || lon === null) {
    return Response.json(
      { error: "Provide finite lat and lon within [-90, 90] and [-180, 180], respectively." },
      { status: 400 },
    );
  }

  const catalog = await getSites();
  const limit = Number(params.get("limit") ?? catalog.length);
  if (!Number.isInteger(limit) || limit < 1 || limit > catalog.length) {
    return Response.json(
      { error: `limit must be an integer from 1 through ${catalog.length}.` },
      { status: 400 },
    );
  }

  const sites = catalog
    .map(({ slug, coordinates }) => ({ slug, distanceKm: distanceKm(lat, lon, coordinates) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit)
    .map(({ slug, distanceKm }) => ({ slug, distanceKm: Math.round(distanceKm) }));

  return Response.json({ sites });
}
