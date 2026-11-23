import type { Metadata } from "next";
import Form from "next/form";
import { Suspense } from "react";
import { isPlannerDate, upcomingPhases } from "./phases";
import styles from "./sky-notes.module.css";

export const metadata: Metadata = {
  title: "Sky notes",
  description: "Plan a dark-sky visit with the Moon’s four upcoming phases.",
};

const dayFormat = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const usno = "https://aa.usno.navy.mil/data/MoonPhases";
type Query = Promise<{ date?: string | string[] }>;

async function Calendar({ searchParams }: { searchParams: Query }) {
  const { date: selection } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const date = selection ?? today;
  const valid = isPlannerDate(date);

  return (
    <section className={styles.calendar} aria-labelledby="calendar-title">
      <h2 id="calendar-title" tabIndex={-1}>Moon calendar</h2>
      <Form action="/sky-notes" className={styles.dateForm}>
        <div>
          <label htmlFor="start-date">Starting date (UTC)</label>
          <input
            id="start-date"
            name="date"
            type="date"
            key={valid ? date : "invalid"}
            defaultValue={valid ? date : undefined}
            min="1700-01-01"
            max="2099-12-31"
            required
            aria-invalid={!valid}
            aria-describedby={valid ? undefined : "invalid-date"}
          />
        </div>
        <button type="submit">Show phases</button>
      </Form>
      {valid ? (
        <Suspense
          key={date}
          fallback={
            <p className={styles.message} role="status">
              Looking up the Moon’s phases…
            </p>
          }
        >
          <PhaseTable date={date} />
        </Suspense>
      ) : (
        <p id="invalid-date" className={styles.message}>
          Choose a date from 1700 through 2099.
        </p>
      )}
    </section>
  );
}

async function PhaseTable({ date }: { date: string }) {
  const { phases, archived } = await upcomingPhases(date);
  if (phases.length !== 4) {
    return (
      <p className={styles.message}>
        The observatory table is unavailable. Try again later, or choose a date from 2026 through
        2028 to use the offline edition.
      </p>
    );
  }

  return (
    <div className={styles.table}>
      <ol className={styles.phases} aria-label="Next four moon phases">
        {phases.map(({ name, at }) => (
          <li key={at}>
            <span aria-hidden="true" className={styles.disc} data-phase={name} />
            <h3>{name}</h3>
            <time dateTime={at}>
              {dayFormat.format(new Date(at))}
              <br />
              {at.slice(11, 16)} UTC
            </time>
          </li>
        ))}
      </ol>
      <p>
        <a href={`/sky-notes/calendar.ics?date=${date}`} download>
          Download lunar calendar
        </a>
      </p>
      <p className={styles.credit}>
        {archived ? "Source (offline edition): " : "Source: "}
        <a href={usno}>U.S. Naval Observatory</a>
      </p>
    </div>
  );
}

export default function SkyNotes({ searchParams }: { searchParams: Query }) {
  return (
    <main id="main-content" className={styles.page}>
      <h1>Sky notes</h1>
      <p className={styles.intro}>
        For faint stars, look for a clear, moonless stretch of night. Start with the Moon’s
        calendar.
      </p>
      <Suspense
        fallback={
          <p className={styles.message} role="status">
            Opening the Moon calendar…
          </p>
        }
      >
        <Calendar searchParams={searchParams} />
      </Suspense>
      <section className={styles.field} aria-labelledby="field-title">
        <h2 id="field-title">In the field</h2>
        <div>
          <h3>Look beyond the phase</h3>
          <p>
            A new moon leaves more of the night dark. At other phases, check local moonrise and
            moonset: the sky can still be dark while the Moon is below the horizon.
          </p>
          <h3>Give your eyes time</h3>
          <p>
            Set your headlamp to red before you step outside. Let your eyes adjust for 20–30 minutes
            and put away the bright phone screen.
          </p>
          <a href="https://www.nps.gov/articles/000/astronomy.htm">
            Stargazing tips from the National Park Service
          </a>
        </div>
      </section>
    </main>
  );
}
