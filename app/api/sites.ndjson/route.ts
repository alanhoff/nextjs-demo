import { getSites } from "@/lib/catalog";
import { sitesExportResponse } from "@/lib/sites-export-response";

export async function GET(request: Request) {
  const sites = await getSites();
  const body = sites.map((site) => `${JSON.stringify(site)}\n`).join("");
  return sitesExportResponse(request, "ndjson", body, { "Content-Type": "application/x-ndjson" });
}
