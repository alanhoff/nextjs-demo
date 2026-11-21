import type { Metadata } from "next";
import { Plate } from "@/components/plate";
import { getSite, sites } from "@/lib/catalog";

export function generateStaticParams() {
  return sites.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/plates/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSite(slug);
  return { title: site && `${site.name} photograph`, alternates: { canonical: `/plates/${slug}` } };
}

export default async function PhotoPage({ params }: PageProps<"/plates/[slug]">) {
  const { slug } = await params;
  return (
    <main id="main-content" className="shell">
      <Plate slug={slug} />
    </main>
  );
}
