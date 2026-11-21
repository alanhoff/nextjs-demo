import { getSites } from "@/lib/catalog";

const radians = Math.PI / 180;
const earthRadiusKm = 6371;

function signedDegrees(coordinate: string) {
  return Number.parseFloat(coordinate) * (/[SW]$/.test(coordinate) ? -1 : 1);
}

function greatCircleKm(lat: number, lon: number, siteLat: number, siteLon: number) {
  const haversine =
    Math.sin(((siteLat - lat) * radians) / 2) ** 2 +
    Math.cos(lat * radians) *
      Math.cos(siteLat * radians) *
      Math.sin(((siteLon - lon) * radians) / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(Math.min(1, haversine)));
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  for (const key of params.keys()) {
    if (key !== "lat" && key !== "lon" && key !== "limit") {
      return Response.json({ error: "Supported parameters are lat, lon and limit." }, { status: 400 });
    }
    if (params.getAll(key).length > 1) {
      return Response.json({ error: `Use the ${key} parameter only once.` }, { status: 400 });
    }
  }

  const latitude = params.get("lat")?.trim();
  const longitude = params.get("lon")?.trim();
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!latitude || !longitude || !Number.isFinite(lat) || !Number.isFinite(lon) ||
      Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return Response.json({ error: "Provide latitude from -90 to 90 and longitude from -180 to 180." }, { status: 400 });
  }

  const catalog = await getSites();
  const rawLimit = params.get("limit");
  const limit = rawLimit === null ? catalog.length : Number(rawLimit);
  if (rawLimit !== null && (!Number.isInteger(limit) || limit < 1 || limit > catalog.length)) {
    return Response.json({ error: `limit must be an integer from 1 to ${catalog.length}.` }, { status: 400 });
  }

  const sites = catalog
    .map(({ slug, coordinates }) => {
      const [siteLat, siteLon] = coordinates.split(", ").map(signedDegrees);
      return { slug, distanceKm: greatCircleKm(lat, lon, siteLat, siteLon) };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit)
    .map(({ slug, distanceKm }) => ({ slug, distanceKm: Math.round(distanceKm) }));

  return Response.json({ sites });
}
