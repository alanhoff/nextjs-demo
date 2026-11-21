import Link from "next/link";
import { Suspense } from "react";
import { getSites } from "@/lib/catalog";
import styles from "./compare.module.css";

export const metadata = {
  title: "Compare sites",
  alternates: { canonical: "/compare" },
};

type Search = PageProps<"/compare">["searchParams"];

async function Comparison({ searchParams }: { searchParams: Search }) {
  const [{ left = "", right = "" }, sites] = await Promise.all([searchParams, getSites()]);
  const first = sites.find((site) => site.slug === left);
  const second = sites.find((site) => site.slug === right);
  const unknown = (left !== "" && !first) || (right !== "" && !second);
  const pair = !unknown && first && second && first !== second ? [first, second] : null;

  return (
    <>
      <form action="/compare" method="get" className={styles.pair}>
        {(["left", "right"] as const).map((side) => (
          <div className={styles.control} key={side}>
            <label htmlFor={side}>{side === "left" ? "Left site" : "Right site"}</label>
            <select id={side} name={side} defaultValue={(side === "left" ? first : second)?.slug ?? ""} required>
              <option value="">Select a site</option>
              {sites.map((site) => (
                <option key={site.slug} value={site.slug}>{site.name}</option>
              ))}
            </select>
          </div>
        ))}
        <button type="submit">Compare sites</button>
      </form>
      {pair ? (
        <section aria-label="Comparison results" className={styles.pair}>
          {pair.map((site) => (
            <article key={site.slug} className={styles.card}>
              <h2><Link href={`/sites/${site.slug}`}>{site.name}</Link></h2>
              <dl>
                <dt>State</dt>
                <dd>{site.state}</dd>
                <dt>Viewpoint</dt>
                <dd>{site.viewpoint}</dd>
                <dt>Field coordinates</dt>
                <dd>{site.coordinates}</dd>
              </dl>
            </article>
          ))}
        </section>
      ) : (
        <p>
          {unknown
            ? "Unknown site. Select a site from each list."
            : first && second
              ? "Choose two different sites."
              : "Select two sites to compare their viewpoints and field coordinates."}
        </p>
      )}
    </>
  );
}

export default function ComparePage({ searchParams }: PageProps<"/compare">) {
  return (
    <main id="main-content" className={`shell ${styles.page}`}>
      <Link href="/#sites">Back to the directory</Link>
      <h1>Compare sites</h1>
      <Suspense fallback={<p role="status">Loading sites…</p>}>
        <Comparison searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
