import { getSites } from "@/lib/catalog";

export async function GET() {
  const sites = await getSites();
  const byState: Record<string, number> = {};

  for (const { state } of sites) {
    byState[state] = (byState[state] ?? 0) + 1;
  }

  return Response.json({ total: sites.length, byState });
}
