"use client";

import { useState } from "react";
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

  return (
    <div className={styles.coordinateRow}>
      <p className={styles.coords} aria-live="polite">
        {showDecimal ? decimalCoordinates(compass) : compass}
      </p>
      <button type="button" onClick={() => setShowDecimal((current) => !current)}>
        {showDecimal ? "Show compass coordinates" : "Show decimal coordinates"}
      </button>
    </div>
  );
}
