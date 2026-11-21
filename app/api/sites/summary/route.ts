import { getSites, regions } from "@/lib/catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  for (const parameter of ["state", "region"]) {
    if (searchParams.getAll(parameter).length > 1) {
      return Response.json(
        {
          code: "repeated_filter",
          parameter,
          error: `The ${parameter} parameter may only be specified once.`,
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  const stateFilter = searchParams.get("state");
  const regionFilter = searchParams.get("region");
  if (regionFilter !== null && !regions.some((region) => region === regionFilter)) {
    return Response.json(
      {
        code: "invalid_filter_value",
        parameter: "region",
        error: `The region parameter must be one of: ${regions.join(", ")}.`,
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const catalog = await getSites();
  const sites = catalog.filter(
    ({ state, region }) =>
      (stateFilter === null || state === stateFilter) &&
      (regionFilter === null || region === regionFilter),
  );
  const byState: Record<string, number> = {};

  const byRegion: Record<string, number> = {};

  for (const { state, region } of sites) {
    byState[state] = (byState[state] ?? 0) + 1;
    byRegion[region] = (byRegion[region] ?? 0) + 1;
  }

  return Response.json({ total: sites.length, byState, byRegion });
}
