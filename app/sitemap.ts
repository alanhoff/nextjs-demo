import type { MetadataRoute } from "next";
import { sites } from "@/lib/catalog";
import { siteOrigin } from "@/lib/origin";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "/",
    "/sky-notes",
    "/compare",
    ...sites.map(({ slug }) => `/sites/${slug}`),
    ...sites.map(({ slug }) => `/plates/${slug}`),
  ].map((path) => ({
    url: new URL(path, siteOrigin).href,
  }));
}
