import { Plate } from "@/components/plate";
import { PlateDialog } from "@/components/plate-dialog";
import { sites } from "@/lib/catalog";

export function generateStaticParams() {
  return sites.map(({ slug }) => ({ slug }));
}

export default async function PhotoOverlay({ params }: PageProps<"/plates/[slug]">) {
  const { slug } = await params;
  return (
    <PlateDialog slug={slug}>
      <Plate slug={slug} modal />
    </PlateDialog>
  );
}
