import { cookies } from "next/headers";
import { cache } from "react";
import { sites } from "@/lib/catalog";

export function bookmarkCookie(slug: string) {
  return `night-atlas-${slug}`;
}

// React's cache lasts one server render; bookmarks must never enter the shared Next cache.
export const getSavedSites = cache(async () => {
  const jar = await cookies();
  return sites.filter((site) => jar.get(bookmarkCookie(site.slug))?.value === "1");
});
