import { getSites } from "@/lib/catalog";
import { sitesExportResponse } from "@/lib/sites-export-response";

export async function GET(request: Request) {
  const sites = await getSites();
  const body = sites.map((site) => `${JSON.stringify(site)}\n`).join("");
  const headers: Record<string, string> = { "Content-Type": "application/x-ndjson" };
  if (new URL(request.url).searchParams.get("download") === "1") {
    headers["Content-Disposition"] = 'attachment; filename="night-atlas-sites.ndjson"';
  }
  return sitesExportResponse(request, "ndjson", body, headers);
}
