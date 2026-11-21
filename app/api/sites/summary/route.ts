import { getSites } from "@/lib/catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.getAll("state").length > 1) {
    return Response.json(
      {
        code: "repeated_filter",
        parameter: "state",
        error: "The state parameter may only be specified once.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const stateFilter = searchParams.get("state");
  const catalog = await getSites();
  const sites = stateFilter === null ? catalog : catalog.filter(({ state }) => state === stateFilter);
  const byState: Record<string, number> = {};

  const byRegion: Record<string, number> = {};

  for (const { state, region } of sites) {
    byState[state] = (byState[state] ?? 0) + 1;
    byRegion[region] = (byRegion[region] ?? 0) + 1;
  }

  return Response.json({ total: sites.length, byState, byRegion });
}
