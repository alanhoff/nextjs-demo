import { filterSites, getSites, regions } from "@/lib/catalog";

async function handleSites(request: Request, head: boolean) {
  const badRequest = (error: string) =>
    head
      ? new Response(null, { status: 400, headers: { "Content-Type": "application/json" } })
      : Response.json({ error }, { status: 400 });
  const params = new URL(request.url).searchParams;

  for (const key of params.keys()) {
    if (key !== "q" && key !== "region" && key !== "limit") {
      return badRequest("Supported parameters are q, region, and limit.");
    }
    if (params.getAll(key).length > 1) {
      return badRequest(`Use the ${key} filter only once.`);
    }
  }

  const q = (params.get("q") ?? "").trim();
  const region = (params.get("region") ?? "").trim().toLowerCase();
  if (params.has("region") && !regions.some((value) => value.toLowerCase() === region)) {
    return badRequest(`Choose a region: ${regions.join(", ")}.`);
  }
  if (q.length > 80) {
    return badRequest("q must be 80 characters or fewer.");
  }

  const limit = params.get("limit");
  if (limit !== null && !/^(?:[1-9][0-9]?|100)$/.test(limit)) {
    return badRequest("limit must be an integer from 1 to 100.");
  }

  const sites = filterSites(await getSites(), region, q);
  const headers = { "Content-Type": "application/json", "X-Total-Count": String(sites.length) };
  if (head) return new Response(null, { headers });
  return Response.json({ sites: limit === null ? sites : sites.slice(0, Number(limit)) }, { headers });
}

export async function GET(request: Request) {
  return handleSites(request, false);
}

export async function HEAD(request: Request) {
  return handleSites(request, true);
}
