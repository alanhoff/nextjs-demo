import { sites } from "@/lib/catalog";

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const site = sites.find((entry) => entry.code === code);
  if (!site) return new Response(null, { status: 404 });

  return new Response(null, { status: 308, headers: { Location: `/sites/${site.slug}` } });
}

export const HEAD = GET;
