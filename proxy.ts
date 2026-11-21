import { type NextRequest, NextResponse } from "next/server";
import { sites } from "@/lib/catalog";

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const code = url.pathname.slice("/go/".length).toUpperCase();
  const site = sites.find((entry) => entry.code === code);
  if (!site) return NextResponse.next();

  url.pathname = `/sites/${site.slug}`;
  return NextResponse.redirect(url, 308);
}

export const config = { matcher: "/go/:code" };
