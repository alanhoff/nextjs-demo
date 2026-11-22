import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSite } from "@/lib/catalog";
import styles from "./plate.module.css";

const descriptions: Partial<Record<string, string>> = {
  acadia:
    "A pale band of stars rises near the center of the sky, while dark trees climb the right edge. Rocks break the still water in the foreground.",
  "death-valley":
    "A bright golden crest cuts through the shadowed dunes at the center. Low shrubs fill the foreground, and a hazy mountain ridge rises behind the dunes toward the right.",
};

export async function Plate({ slug, modal = false }: { slug: string; modal?: boolean }) {
  const site = await getSite(slug);
  if (!site) notFound();
  const description = descriptions[site.slug];
  const descriptionId = description ? `plate-description-${site.slug}` : undefined;
  const title = modal ? <h2 id="plate-title">{site.name}</h2> : <h1>{site.name}</h1>;
  return (
    <figure className={styles.plate}>
      <Image
        alt={site.imageAlt}
        aria-describedby={descriptionId}
        src={site.image}
        width={1400}
        height={900}
        sizes="(max-width: 1200px) 96vw, 1150px"
      />
      <figcaption>
        <div>
          {title}
          <p>{site.imageAlt}.</p>
          {description && <p id={descriptionId}>{description}</p>}
        </div>
        {!modal && <Link href={`/sites/${site.slug}`}>Read the site notes</Link>}
      </figcaption>
    </figure>
  );
}
