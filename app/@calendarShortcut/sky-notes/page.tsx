"use client";

import type { MouseEvent } from "react";

function preserveRouterState(event: MouseEvent<HTMLAnchorElement>) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  const from = location.href;
  const to = event.currentTarget.href;
  const state = history.state;
  if (from === to || state == null) return;

  // Let the browser create the entry and focus the heading. Native fragment
  // navigation drops history.state, which Next needs to restore the search route.
  window.addEventListener(
    "hashchange",
    (change) => {
      if (
        change.oldURL === from &&
        change.newURL === to &&
        location.href === to &&
        history.state == null
      ) {
        history.replaceState(state, "");
      }
    },
    { once: true },
  );
}

export default function CalendarSkipLink() {
  return (
    // biome-ignore lint/a11y/useValidAnchor: The anchor navigates to a real heading; the handler only preserves router history state.
    <a
      className="skip-link calendar-skip-link"
      href="#calendar-title"
      onClick={preserveRouterState}
    >
      Skip to moon calendar
    </a>
  );
}
