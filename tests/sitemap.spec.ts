import { expect, test } from "@playwright/test";
import { sites } from "../lib/catalog";
import { siteOrigin } from "../lib/origin";

test("sitemap lists exactly the canonical public page URLs", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^application\/xml(?:;|$)/i);

  const xml = await response.text();
  const urls = Array.from(xml.matchAll(/<loc>([^<]*)<\/loc>/g), ([, url]) => url);
  for (const loc of urls) {
    const url = new URL(loc);
    expect(url.search).toBe("");
    expect(url.hash).toBe("");
  }
  const expectedUrls = [
    "/",
    "/sky-notes",
    "/compare",
    ...sites.flatMap(({ slug }) => [`/sites/${slug}`, `/plates/${slug}`]),
  ].map((path) => new URL(path, siteOrigin).href);

  expect(urls.sort()).toEqual(expectedUrls.sort());
});
