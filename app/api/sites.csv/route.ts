import { getSites } from "@/lib/catalog";
import { formatSitesCsv, sitesCsvContentType } from "@/lib/sites-csv";

export async function GET(request: Request) {
  const regions = new URL(request.url).searchParams.getAll("region");
  const region = regions.length === 1 ? regions[0].trim().toLowerCase() : undefined;
  const sites = await getSites();
  const matchingSites =
    region === undefined ? sites : sites.filter((site) => site.region.toLowerCase() === region);

  return new Response(formatSitesCsv(matchingSites), {
    headers: {
      "Content-Type": sitesCsvContentType,
      "Content-Disposition": 'attachment; filename="sites.csv"',
    },
  });
}
