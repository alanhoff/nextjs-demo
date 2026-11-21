import { getSites } from "@/lib/catalog";
import { formatSitesCsv, sitesCsvContentType } from "@/lib/sites-csv";

export async function GET() {
  return new Response(formatSitesCsv(await getSites()), {
    headers: {
      "Content-Type": sitesCsvContentType,
      "Content-Disposition": 'attachment; filename="sites.csv"',
    },
  });
}
