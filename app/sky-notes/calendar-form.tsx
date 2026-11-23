"use client";

import Form from "next/form";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import styles from "./sky-notes.module.css";

const SelectionContext = createContext<(date: string | null) => void>(() => {});

export function CalendarForm({ children }: { children: ReactNode }) {
  const [date, setDate] = useState<string | null>();
  const input = useRef<HTMLInputElement>(null);
  const previousDate = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (date === undefined || !input.current) return;
    const field = input.current;
    // Leave an edit made in the initial shell alone; later URL changes reset the field.
    if (previousDate.current !== undefined || field.value === "") field.value = date ?? "";
    field.defaultValue = date ?? "";
    previousDate.current = date;
  }, [date]);

  return (
    <SelectionContext.Provider value={setDate}>
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
            aria-invalid={date === null}
            aria-describedby={date === null ? "invalid-date" : undefined}
          />
        </div>
        <button type="submit">Show phases</button>
      </Form>
      {children}
    </SelectionContext.Provider>
  );
}

// Apply request-specific state without replacing the shell's focus target.
export function CalendarSelection({ date }: { date: string | null }) {
  const setDate = useContext(SelectionContext);
  useEffect(() => setDate(date), [date, setDate]);
  return null;
}
