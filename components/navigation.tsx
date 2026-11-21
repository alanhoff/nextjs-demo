"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mark } from "./marks";

export function Navigation() {
  const path = usePathname();
  const atlas = path === "/" || path.startsWith("/sites/") || path.startsWith("/plates/");
  return (
    <nav aria-label="Main navigation" className="main-nav">
      <Link
        href="/"
        data-current={atlas || undefined}
        aria-current={path === "/" ? "page" : undefined}
      >
        Atlas
      </Link>
      <Link href="/sky-notes" aria-current={path === "/sky-notes" ? "page" : undefined}>
        Sky notes
      </Link>
      <Link
        className="book-nav"
        href="/logbook"
        aria-current={path === "/logbook" ? "page" : undefined}
      >
        <Mark name="bookmark" size={16} /> Logbook
      </Link>
    </nav>
  );
}
