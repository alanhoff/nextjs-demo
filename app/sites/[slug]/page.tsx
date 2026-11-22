import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SaveButton } from "@/components/save-button";
import { getSite, sites } from "@/lib/catalog";
import styles from "./site.module.css";

type Props = PageProps<"/sites/[slug]">;

export function generateStaticParams() {
  return sites.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const site = await getSite((await params).slug);
  if (!site) notFound();
  return {
    title: site.name,
    description: site.description,
    alternates: { canonical: `/sites/${site.slug}` },
    openGraph: {
      title: `${site.name} · Night Atlas`,
      description: site.description,
      images: [{ url: site.image, alt: site.imageAlt }],
    },
  };
}

export default async function SitePage({ params }: Props) {
  const site = await getSite((await params).slug);
  if (!site) notFound();

  return (
    <main id="main-content" className={styles.page}>
      <Link className={styles.back} href="/#sites">
        <span aria-hidden="true">←</span> All sites
      </Link>
      <div className={styles.titleRow}>
        <div>
          <p className={styles.location}>{site.state} · National Park</p>
          <h1>{site.name}</h1>
        </div>
        <SaveButton slug={site.slug} />
      </div>
      <Link
        className={styles.plate}
        id="enlarge-photo"
        href={`/plates/${site.slug}`}
        scroll={false}
        aria-label={`Enlarge photo of ${site.name}`}
      >
        <Image
          src={site.image}
          alt={site.imageAlt}
          fill
          sizes="(min-width: 1200px) 1120px, 94vw"
          preload
        />
        <span className={styles.enlarge}>
          Enlarge photo <span aria-hidden="true">⤢</span>
        </span>
      </Link>
      <div className={styles.fieldNotes}>
        <div>
          <p className={styles.location}>Viewing spot</p>
          <h2>{site.viewpoint}</h2>
          <p className={styles.coords}>{site.coordinates}</p>
          <p className={styles.shortLink}>
            Short link:{" "}
            <Link href={`/go/${site.code}`} prefetch={false}>
              /go/{site.code}
            </Link>
          </p>
          <Link className={styles.source} href={`/compare?left=${site.slug}`}>
            Compare this site
          </Link>
        </div>
        <div className={styles.notes}>
          <p className={styles.lede}>{site.description}</p>
          {site.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
          <a className={styles.source} href={site.sourceUrl}>
            National Park Service guide <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </main>
  );
}
