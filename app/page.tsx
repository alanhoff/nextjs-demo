import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Mark } from "@/components/marks";
import { SaveButton } from "@/components/save-button";
import { filterSites, getSites, regions } from "@/lib/catalog";

export const metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    title: "Night Atlas — A dark-sky field guide",
    description: "Viewing spots and field notes from six U.S. national parks.",
    images: [
      { url: "/images/cover.webp", alt: "The Milky Way above Sunrise Point in Bryce Canyon." },
    ],
  },
};

function Cover() {
  return (
    <section className="cover" aria-labelledby="cover-title">
      <Image
        className="cover-image"
        src="/images/cover.webp"
        alt="The Milky Way above a silhouetted observer at Sunrise Point in Bryce Canyon."
        fill
        sizes="(max-width: 1440px) 100vw, 1380px"
        preload
      />
      <div className="cover-copy">
        <p className="eyebrow">
          <span /> Dark-sky field guide
        </p>
        <h1 id="cover-title">
          After the
          <br />
          <em>last light.</em>
        </h1>
        <p className="standfirst">Where to watch the stars in six of America’s national parks.</p>
        <a className="cover-button" href="#sites">
          Browse the sites <Mark name="down" size={16} />
        </a>
      </div>
      <Link className="cover-location" href="/sites/bryce-canyon">
        <Mark name="pin" size={15} /> Sunrise Point, Bryce Canyon <Mark name="diagonal" size={12} />
      </Link>
    </section>
  );
}

type Search = PageProps<"/">["searchParams"];

async function Directory({ searchParams }: { searchParams: Search }) {
  const [params, sites] = await Promise.all([searchParams, getSites()]);
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const region =
    regions.find(
      (r) => typeof params.region === "string" && params.region.toLowerCase() === r.toLowerCase(),
    ) ?? "";
  const matches = filterSites(sites, region, q);

  function regionLink(value: string) {
    const query = new URLSearchParams();
    if (value) query.set("region", value);
    if (q) query.set("q", q);
    return { pathname: "/", query: Object.fromEntries(query), hash: "sites" };
  }

  return (
    <>
      <div className="index-head">
        <h2>Observation sites</h2>
        <Form action="/#sites" className="search-form" key={`${q}:${region}`}>
          {region && <input type="hidden" name="region" value={region} />}
          <label className="sr-only" htmlFor="site-search">
            Search parks, states, and viewpoints
          </label>
          <input
            id="site-search"
            type="search"
            name="q"
            defaultValue={q}
            maxLength={80}
            placeholder="Park, state or viewpoint"
          />
          <button aria-label="Search sites" type="submit">
            <Mark name="search" size={18} />
          </button>
        </Form>
      </div>
      <p className="catalog-actions">
        <Link href="/compare">Compare sites</Link>
        <a href="/api/sites.csv" download="sites.csv">
          Download site catalog (CSV)
        </a>
      </p>
      <div className="index-tools">
        <nav aria-label="Filter by region" className="region-links">
          {["", ...regions].map((r) => (
            <Link key={r} href={regionLink(r)} aria-current={region === r ? "true" : undefined}>
              {r || "All regions"}
            </Link>
          ))}
        </nav>
        <output className="result-count">
          {matches.length} {matches.length === 1 ? "site" : "sites"}
        </output>
      </div>
      {matches.length ? (
        <ul className="site-grid">
          {matches.map((site) => (
            <li className="site-card" key={site.slug}>
              <Link href={`/sites/${site.slug}`} className="card-link">
                <div className="site-photo">
                  <Image
                    src={site.image}
                    alt=""
                    fill
                    sizes="(max-width: 620px) 94vw, (max-width: 940px) 47vw, (max-width: 1440px) 31vw, 415px"
                  />
                </div>
                <div className="card-caption">
                  <span className="state">
                    <span />
                    {site.state}
                  </span>
                  <h3>{site.name}</h3>
                  <span className="card-arrow">
                    <Mark name="diagonal" size={16} />
                  </span>
                </div>
              </Link>
              <div className="card-save">
                <SaveButton slug={site.slug} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-result">
          <h3>No matching sites</h3>
          <p>Try another park or state, or return to the full index.</p>
          <Link href="/#sites">Clear filters</Link>
        </div>
      )}
    </>
  );
}

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main id="main-content">
      <div className="cover-shell">
        <Cover />
      </div>
      <section id="sites" aria-label="Site directory" className="shell directory">
        <Suspense
          fallback={
            <div className="index-head">
              <h2>Observation sites</h2>
              <p role="status">Loading sites…</p>
            </div>
          }
        >
          <Directory searchParams={searchParams} />
        </Suspense>
      </section>
    </main>
  );
}
