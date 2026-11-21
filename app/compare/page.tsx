import { Suspense } from "react";
import { getSites } from "@/lib/catalog";
import styles from "./compare.module.css";

export const metadata = {
  title: "Compare sites",
  alternates: { canonical: "/compare" },
};

type Search = PageProps<"/compare">["searchParams"];

async function Comparison({ searchParams }: { searchParams: Search }) {
  const [{ left, right }, sites] = await Promise.all([searchParams, getSites()]);
  const first = sites.find((site) => site.slug === left);
  const second = sites.find((site) => site.slug === right);
  const unknown = (left && !first) || (right && !second);
  const duplicate = first && second && first.slug === second.slug;

  return (
    <>
      <form action="/compare" method="get" className={styles.form}>
        {([
          ["left", "Left site", first?.slug],
          ["right", "Right site", second?.slug],
        ] as const).map(([name, label, slug]) => (
          <div key={name}>
            <label htmlFor={name}>{label}</label>
            <select id={name} name={name} defaultValue={slug ?? ""} required>
              <option value="">Select a site</option>
              {sites.map((site) => (
                <option key={site.slug} value={site.slug}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
        ))}
        <button type="submit">Compare sites</button>
      </form>
      {unknown ? (
        <p>Unknown site. Select a site from each list.</p>
      ) : duplicate ? (
        <p>Choose two different sites to compare.</p>
      ) : first && second ? (
        <section aria-label="Field comparison" className={styles.results}>
          {[first, second].map((site) => (
            <article key={site.slug}>
              <h2>{site.name}</h2>
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
        <p>Select two sites to compare their viewpoints and field coordinates.</p>
      )}
    </>
  );
}

export default function ComparePage({ searchParams }: PageProps<"/compare">) {
  return (
    <main id="main-content" className={`shell ${styles.page}`}>
      <h1>Compare sites</h1>
      <Suspense fallback={<p role="status">Loading sites…</p>}>
        <Comparison searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
