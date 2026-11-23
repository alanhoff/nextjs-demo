"use client";

import Form from "next/form";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import styles from "./sky-notes.module.css";

type Selection = { date: string | null; query: string };
const SelectionContext = createContext<(selection: Selection) => void>(() => {});

export function CalendarForm({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<Selection>();
  const input = useRef<HTMLInputElement>(null);
  const previousQuery = useRef<string>(undefined);

  useEffect(() => {
    if (!selection || !input.current) return;
    const field = input.current;
    const { date, query } = selection;
    // Setting the default alone preserves the browser's dirty value, even if empty.
    field.defaultValue = date ?? "";
    if (previousQuery.current !== undefined && previousQuery.current !== query) {
      field.value = date ?? "";
    }
    previousQuery.current = query;
    field.setAttribute("aria-invalid", String(date === null));
    if (date === null) field.setAttribute("aria-describedby", "invalid-date");
    else field.removeAttribute("aria-describedby");
    // Distinguish client initialization from the inline streamed initialization.
    field.setAttribute("data-calendar-initialized", "true");
  }, [selection]);

  return (
    <SelectionContext.Provider value={setSelection}>
      <Form action="/sky-notes" className={styles.dateForm}>
        <div>
          <label htmlFor="start-date">Starting date (UTC)</label>
          <input
            id="start-date"
            name="date"
            type="date"
            min="1700-01-01"
            max="2099-12-31"
            required
            ref={input}
            suppressHydrationWarning
          />
        </div>
        <button type="submit">Show phases</button>
      </Form>
      {children}
    </SelectionContext.Provider>
  );
}

// Apply request-specific state without replacing the shell's focus target.
export function CalendarSelection({ date, query }: Selection) {
  const setSelection = useContext(SelectionContext);
  useEffect(() => setSelection({ date, query }), [date, query, setSelection]);
  return null;
}
