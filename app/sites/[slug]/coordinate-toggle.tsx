"use client";

import { useId, useState } from "react";
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
  const hintId = useId();

  return (
    <div className={styles.coordinateRow}>
      <p className={styles.coords} aria-live="polite">
        {showDecimal ? decimalCoordinates(compass) : compass}
      </p>
      <button
        type="button"
        aria-describedby={showDecimal ? undefined : hintId}
        onClick={() => setShowDecimal((current) => !current)}
      >
        {showDecimal ? "Show compass coordinates" : "Show decimal coordinates"}
      </button>
      {!showDecimal && (
        <span className={styles.coordinateHint} id={hintId}>
          Latitude comes first; negative values mean south or west.
        </span>
      )}
    </div>
  );
}
