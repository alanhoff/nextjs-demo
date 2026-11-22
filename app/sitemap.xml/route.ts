import { sites } from "@/lib/catalog";
import { siteOrigin } from "@/lib/origin";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function GET() {
  const paths = [
    "/",
    "/sky-notes",
    "/compare",
    ...sites.map(({ slug }) => `/sites/${slug}`),
    ...sites.map(({ slug }) => `/plates/${slug}`),
  ];
  const entries = paths.map((path) => `<url><loc>${escapeXml(new URL(path, siteOrigin).href)}</loc></url>`);

  return new Response(
    ['<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...entries, "</urlset>"].join("\n"),
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
}
