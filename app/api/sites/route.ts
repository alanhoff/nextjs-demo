import { createHash } from "node:crypto";
import { filterSites, getSites, regions } from "@/lib/catalog";
import { matchesIfNoneMatch } from "@/lib/etag";
import { toSiteSummary, validateSiteView } from "@/lib/site-view";
import { formatSitesCsv, sitesCsvContentType } from "@/lib/sites-csv";

async function handleSites(request: Request, head: boolean) {
  const badRequest = (error: string) =>
    head
      ? new Response(null, { status: 400, headers: { "Content-Type": "application/json" } })
      : Response.json({ error }, { status: 400 });
  const params = new URL(request.url).searchParams;

  for (const key of params.keys()) {
    if (!["q", "region", "state", "limit", "offset", "view"].includes(key)) {
      return badRequest("Supported parameters are q, region, state, limit, offset, and view.");
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

  const viewError = validateSiteView(params);
  if (viewError) return badRequest(viewError);
  const view = params.get("view");

  const stateFilter = params.get("state");
  const matches = filterSites(await getSites(), region, q);
  const sites = stateFilter === null ? matches : matches.filter(({ state }) => state === stateFilter);
  const csv = request.headers.get("Accept")?.toLowerCase() === "text/csv";
  const headers = new Headers({
    "Content-Type": csv ? sitesCsvContentType : "application/json",
    Vary: "Accept",
    "X-Total-Count": String(sites.length),
  });
  const end = limit === null ? undefined : offset + Number(limit);
  if (limit !== null && end !== undefined && end < sites.length) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (regionFilter) next.set("region", regionFilter);
    if (stateFilter !== null) next.set("state", stateFilter);
    next.set("offset", String(end));
    next.set("limit", limit);
    if (view === "summary") next.set("view", view);
    headers.set("Link", `</api/sites?${next}>; rel="next"`);
  }
  const page = sites.slice(offset, end);
  const body = csv
    ? formatSitesCsv(page)
    : JSON.stringify({
        sites: view === "summary" ? page.map(toSiteSummary) : page,
      });
  const tag = `"${createHash("sha256").update(body).digest("hex")}"`;
  headers.set("ETag", `W/${tag}`);
  if (matchesIfNoneMatch(request.headers.get("If-None-Match"), tag)) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(head ? null : body, { headers });
}

export async function GET(request: Request) {
  return handleSites(request, false);
}

export async function HEAD(request: Request) {
  return handleSites(request, true);
}
