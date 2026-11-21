import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { SaveButton } from "@/components/save-button";
import { getSavedSites } from "@/lib/logbook";
import styles from "./logbook.module.css";

export const metadata: Metadata = {
  title: "Logbook",
  description: "Your saved dark-sky sites.",
  robots: { index: false, follow: true },
};

async function SavedSites() {
  const saved = await getSavedSites();
  if (!saved.length) {
    return (
      <section className={styles.empty}>
        <div className={styles.emptyPhoto}>
          <Image src="/images/joshua-tree.webp" alt="" fill sizes="(max-width: 600px) 90vw, 38vw" />
        </div>
        <div className={styles.emptyText}>
          <h2>No saved sites yet</h2>
          <p>Use the bookmark on any site in the atlas to keep it here for another night.</p>
          <Link className={styles.browse} href="/#sites">
            Browse the sites <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <ul className={styles.entries} aria-label="Saved sites">
      {saved.map((site) => (
        <li key={site.slug} className={styles.entry}>
          <Link href={`/sites/${site.slug}`} className={styles.siteLink}>
            <span className={styles.thumbnail}>
              <Image src={site.image} alt="" fill sizes="(max-width: 600px) 76px, 144px" />
            </span>
            <span className={styles.entryText}>
              <span className={styles.state}>{site.state}</span>
              <span className={styles.name}>{site.name}</span>
            </span>
          </Link>
          <SaveButton slug={site.slug} />
        </li>
      ))}
    </ul>
  );
}

export default function Logbook() {
  return (
    <main id="main-content" className={styles.page}>
      <h1>Your logbook</h1>
      <p className={styles.intro}>Saved on this browser, ready for your next trip.</p>
      <Suspense fallback={<p role="status">Opening your logbook…</p>}>
        <SavedSites />
      </Suspense>
    </main>
  );
}
