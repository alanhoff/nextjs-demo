import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSite } from "@/lib/catalog";
import styles from "./plate.module.css";

export async function Plate({ slug, modal = false }: { slug: string; modal?: boolean }) {
  const site = await getSite(slug);
  if (!site) notFound();
  const title = modal ? <h2 id="plate-title">{site.name}</h2> : <h1>{site.name}</h1>;
  return (
    <figure className={styles.plate}>
      <Image
        alt={site.imageAlt}
        src={site.image}
        width={1400}
        height={900}
        sizes="(max-width: 1200px) 96vw, 1150px"
      />
      <figcaption>
        <div>
          {title}
          <p>{site.imageAlt}.</p>
        </div>
        {!modal && <Link href={`/sites/${site.slug}`}>Read the site notes</Link>}
      </figcaption>
    </figure>
  );
}
