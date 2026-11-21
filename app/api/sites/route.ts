import { filterSites, getSites, regions } from "@/lib/catalog";

async function handleSites(request: Request, head: boolean) {
  const badRequest = (error: string) =>
    head
      ? new Response(null, { status: 400, headers: { "Content-Type": "application/json" } })
      : Response.json({ error }, { status: 400 });
  const params = new URL(request.url).searchParams;

  for (const key of params.keys()) {
    if (!["q", "region", "limit", "offset", "view"].includes(key)) {
      return badRequest("Supported parameters are q, region, limit, offset, and view.");
    }
    if (params.getAll(key).length > 1) {
      return badRequest(`Use the ${key} filter only once.`);
    }
  }

  const q = (params.get("q") ?? "").trim();
  const regionFilter = (params.get("region") ?? "").trim();
  const region = regionFilter.toLowerCase();
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

  const rawOffset = params.get("offset") ?? "0";
  const offset = Number(rawOffset);
  if (!/^[0-9]+$/.test(rawOffset) || !Number.isSafeInteger(offset)) {
    return badRequest("offset must be a nonnegative safe integer.");
  }

  const view = params.get("view");
  if (view !== null && view !== "summary") {
    return badRequest("view must be summary.");
  }

  const sites = filterSites(await getSites(), region, q);
  const headers = new Headers({
    "Content-Type": "application/json",
    "X-Total-Count": String(sites.length),
  });
  const end = limit === null ? undefined : offset + Number(limit);
  if (limit !== null && end !== undefined && end < sites.length) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (regionFilter) next.set("region", regionFilter);
    next.set("offset", String(end));
    next.set("limit", limit);
    if (view === "summary") next.set("view", view);
    headers.set("Link", `</api/sites?${next}>; rel="next"`);
  }
  if (head) return new Response(null, { headers });
  const page = sites.slice(offset, end);
  return Response.json(
    { sites: view === "summary" ? page.map(({ description, notes, ...site }) => site) : page },
    { headers },
  );
}

export async function GET(request: Request) {
  return handleSites(request, false);
}

export async function HEAD(request: Request) {
  return handleSites(request, true);
}
