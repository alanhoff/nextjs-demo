import { getSite } from "@/lib/catalog";
import { toSiteSummary, validateSiteView } from "@/lib/site-view";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const query = new URL(request.url).searchParams;
  const viewError = validateSiteView(query);
  if (viewError) return Response.json({ error: viewError }, { status: 400 });

  const { slug } = await params;
  const site = await getSite(slug);

  return site
    ? Response.json(query.get("view") === "summary" ? toSiteSummary(site) : site)
    : Response.json({ error: "Site not found." }, { status: 404 });
}
