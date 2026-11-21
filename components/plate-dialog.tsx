"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./plate.module.css";

export function PlateDialog({ children, slug }: { children: ReactNode; slug: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      // The router moves focus after committing the previous page.
      requestAnimationFrame(() => {
        if (window.location.pathname === `/sites/${slug}`) {
          document.getElementById("enlarge-photo")?.focus({ preventScroll: true });
        }
      });
    };
  }, [slug]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="plate-title"
      className={styles.dialog}
      onCancel={(event) => {
        event.preventDefault();
        router.back();
      }}
    >
      <button
        className={styles.dismiss}
        type="button"
        onClick={() => router.back()}
        aria-label="Close photograph"
      >
        ×
      </button>
      {children}
    </dialog>
  );
}
