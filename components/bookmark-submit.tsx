"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import styles from "@/app/logbook/logbook.module.css";

export function BookmarkSubmit({ label, children }: { label: string; children: ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={styles.toggle}
      disabled={pending}
      aria-busy={pending}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
