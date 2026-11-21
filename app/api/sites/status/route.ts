import { connection } from "next/server";
import { getSites } from "@/lib/catalog";

export async function GET() {
  await connection();
  const sites = await getSites();

  return Response.json(
    { catalog: "night-atlas", site_count: sites.length, generated_at: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
