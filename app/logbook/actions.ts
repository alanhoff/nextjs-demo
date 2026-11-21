"use server";

import { cookies, headers } from "next/headers";
import { sites } from "@/lib/catalog";
import { bookmarkCookie } from "@/lib/logbook";

export async function setBookmark(slug: string, intent: "save" | "remove") {
  if (!sites.some((site) => site.slug === slug) || !["save", "remove"].includes(intent)) {
    throw new Error("Unknown site or bookmark action.");
  }

  const [jar, request] = await Promise.all([cookies(), headers()]);
  const secure =
    request.get("origin")?.startsWith("https://") ?? request.get("x-forwarded-proto") === "https";
  jar.set(bookmarkCookie(slug), intent === "save" ? "1" : "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: intent === "save" ? 60 * 60 * 24 * 365 : 0,
  });
}
