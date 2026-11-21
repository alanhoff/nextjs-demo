import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/origin";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/logbook" },
    sitemap: new URL("/sitemap.xml", siteOrigin).href,
  };
}
