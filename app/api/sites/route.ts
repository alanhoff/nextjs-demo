import { filterSites, getSites, regions } from "@/lib/catalog";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  for (const key of params.keys()) {
    if (key !== "q" && key !== "region" && key !== "limit") {
      return Response.json({ error: "Supported parameters are q, region, and limit." }, { status: 400 });
    }
    if (params.getAll(key).length > 1) {
      return Response.json({ error: `Use the ${key} filter only once.` }, { status: 400 });
    }
  }

  const q = (params.get("q") ?? "").trim();
  const region = (params.get("region") ?? "").trim().toLowerCase();
  if (params.has("region") && !regions.some((value) => value.toLowerCase() === region)) {
    return Response.json({ error: `Choose a region: ${regions.join(", ")}.` }, { status: 400 });
  }
  if (q.length > 80) {
    return Response.json({ error: "q must be 80 characters or fewer." }, { status: 400 });
  }

  const limit = params.get("limit");
  if (limit !== null && !/^(?:[1-9][0-9]?|100)$/.test(limit)) {
    return Response.json({ error: "limit must be an integer from 1 to 100." }, { status: 400 });
  }

  const sites = filterSites(await getSites(), region, q);
  return Response.json({ sites: limit === null ? sites : sites.slice(0, Number(limit)) });
}
