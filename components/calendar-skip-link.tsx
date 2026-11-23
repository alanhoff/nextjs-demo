"use client";

import { usePathname } from "next/navigation";

export function CalendarSkipLink() {
  if (usePathname() !== "/sky-notes") return null;

  return (
    <a className="skip-link calendar-skip-link" href="#calendar-title">
      Skip to moon calendar
    </a>
  );
}
