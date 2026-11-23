import { getSites } from "@/lib/catalog";
import { sitesExportResponse } from "@/lib/sites-export-response";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.getAll("state").length > 1) {
    return Response.json({ error: "Use the state filter only once." }, { status: 400 });
  }
  const state = searchParams.get("state");
  const sites = await getSites();
  const matchingSites = state === null ? sites : sites.filter((site) => site.state === state);
  const body = matchingSites.map((site) => `${JSON.stringify(site)}\n`).join("");
  const headers: Record<string, string> = { "Content-Type": "application/x-ndjson" };
  if (searchParams.get("download") === "1") {
    headers["Content-Disposition"] = 'attachment; filename="night-atlas-sites.ndjson"';
  }
  return sitesExportResponse(request, "ndjson", body, headers);
}
