import { filterSites, getSites, regions } from "@/lib/catalog";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  for (const key of params.keys()) {
    if (key !== "q" && key !== "region") {
      return Response.json({ error: "Supported filters are q and region." }, { status: 400 });
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

  return Response.json({ sites: filterSites(await getSites(), region, q) });
}
