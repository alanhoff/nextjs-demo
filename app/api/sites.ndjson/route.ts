import { getSites } from "@/lib/catalog";

export async function GET() {
  const sites = await getSites();
  const body = sites.map((site) => `${JSON.stringify(site)}\n`).join("");
  return new Response(body, { headers: { "Content-Type": "application/x-ndjson" } });
}
