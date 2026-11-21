import type { MetadataRoute } from "next";
import { sites } from "@/lib/catalog";
import { siteOrigin } from "@/lib/origin";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/sky-notes", ...sites.map(({ slug }) => `/sites/${slug}`)].map((path) => ({
    url: new URL(path, siteOrigin).href,
  }));
}
