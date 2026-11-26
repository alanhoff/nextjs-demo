import { connection } from "next/server";
import { getSites } from "@/lib/catalog";

export async function GET() {
  await connection();
  const sites = await getSites();

  return Response.json(
    {
      catalog: "night-atlas",
      site_count: sites.length,
      state_count: new Set(sites.map((site) => site.state)).size,
      region_count: new Set(sites.map((site) => site.region)).size,
      generated_at: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
