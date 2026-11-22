import { getSites } from "@/lib/catalog";
import { formatSitesCsv, sitesCsvContentType } from "@/lib/sites-csv";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.getAll("state").length > 1) {
    return Response.json({ error: "Use the state filter only once." }, { status: 400 });
  }
  const state = searchParams.get("state");
  const regions = searchParams.getAll("region");
  const region = regions.length === 1 ? regions[0].trim().toLowerCase() : undefined;
  const sites = await getSites();
  const matchingSites = sites.filter(
    (site) =>
      (state === null || site.state === state) &&
      (region === undefined || site.region.toLowerCase() === region),
  );

  return new Response(formatSitesCsv(matchingSites), {
    headers: {
      "Content-Type": sitesCsvContentType,
      "Content-Disposition": 'attachment; filename="sites.csv"',
    },
  });
}
