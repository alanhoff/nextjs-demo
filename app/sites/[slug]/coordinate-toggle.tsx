"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./site.module.css";

function decimalCoordinates(compass: string) {
  return compass
    .split(", ")
    .map((coordinate) => {
      const degrees = Number.parseFloat(coordinate);
      return (/[SW]$/.test(coordinate) ? -degrees : degrees).toFixed(3);
    })
    .join(", ");
}

export function CoordinateToggle({ compass }: { compass: string }) {
  const [showDecimal, setShowDecimal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const hintId = useId();

  useEffect(() => {
    if (showDecimal) return;

    function dismissHint(event: KeyboardEvent) {
      const button = buttonRef.current;
      if (
        event.key === "Escape" &&
        (button?.matches(":hover, :focus") || hintRef.current?.matches(":hover"))
      ) {
        setDismissed(true);
      }
    }

    document.addEventListener("keydown", dismissHint);
    return () => document.removeEventListener("keydown", dismissHint);
  }, [showDecimal]);

  return (
    <div className={styles.coordinateRow}>
      <p className={styles.coords} aria-live="polite">
        {showDecimal ? decimalCoordinates(compass) : compass}
      </p>
      <button
        type="button"
        aria-describedby={showDecimal ? undefined : hintId}
        ref={buttonRef}
        onPointerEnter={(event) => {
          if (!event.currentTarget.matches(":focus")) setDismissed(false);
        }}
        onFocus={(event) => {
          if (!event.currentTarget.matches(":hover")) setDismissed(false);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.matches(":hover")) setDismissed(false);
        }}
        onPointerLeave={(event) => {
          if (!event.currentTarget.matches(":focus")) setDismissed(false);
        }}
        onClick={() => setShowDecimal((current) => !current)}
      >
        {showDecimal ? "Show compass coordinates" : "Show decimal coordinates"}
      </button>
      <span
        className={styles.coordinateHint}
        data-available={!showDecimal && !dismissed}
        id={hintId}
        ref={hintRef}
      >
        Latitude comes first; negative values mean south or west.
      </span>
    </div>
  );
}
