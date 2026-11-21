import { getSites } from "@/lib/catalog";

export async function GET(request: Request) {
  const stateFilter = new URL(request.url).searchParams.get("state");
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
