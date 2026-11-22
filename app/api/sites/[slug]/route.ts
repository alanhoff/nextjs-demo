import { getSite } from "@/lib/catalog";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getSite(slug);

  return site
    ? Response.json(site)
    : Response.json({ error: "Site not found." }, { status: 404 });
}
