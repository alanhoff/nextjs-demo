import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarForm, CalendarSelection } from "./calendar-form";
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

// Runs as the document parses the streamed selection, independently of hydration.
// The browser updates the current value only if the input has not been edited.
const initializeDate = `(() => {
  const field = document.getElementById('start-date');
  const date = document.currentScript.dataset.date;
  field.defaultValue = date;
  field.setAttribute('aria-invalid', String(!date));
  if (!date) field.setAttribute('aria-describedby', 'invalid-date');
  else field.removeAttribute('aria-describedby');
})();`;

// The browser can retry fragment landing as the document finishes loading.
// Land immediately, but keep the fragment out of the URL until that work is done.
const activateCalendarShortcut = `(() => {
  const shortcut = document.querySelector('.calendar-skip-link');
  const heading = document.getElementById('calendar-title');
  if (!shortcut || !heading) return;
  let pending = null;
  const activate = (event) => {
    if (document.readyState !== 'loading' || event.defaultPrevented ||
        event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    if (location.hash !== shortcut.hash && !pending) {
      const from = location.href;
      const fragment = shortcut.hash;
      pending = new AbortController();
      const { signal } = pending;
      const cancel = () => {
        pending.abort();
        pending = null;
      };
      for (const type of ['popstate', 'hashchange', 'pagehide']) {
        window.addEventListener(type, cancel, { signal });
      }
      window.addEventListener('load', () => {
        // Run after load dispatch, not during the browser's final fragment processing.
        setTimeout(() => {
          if (signal.aborted) return;
          cancel();
          if (location.href === from) history.pushState(history.state, '', fragment);
        }, 0);
      }, { once: true, signal });
    }
    heading.focus({ preventScroll: true });
    heading.scrollIntoView();
  };
  shortcut.addEventListener('click', activate);
  document.addEventListener('DOMContentLoaded', () => {
    shortcut.removeEventListener('click', activate);
  }, { once: true });
})();`;

async function CalendarResults({ searchParams }: { searchParams: Query }) {
  const { date: selection } = await searchParams;
  const date = selection ?? new Date().toISOString().slice(0, 10);
  const valid = isPlannerDate(date);

  return (
    <>
      <script data-date={valid ? date : ""}>{initializeDate}</script>
      <CalendarSelection date={valid ? date : null} query={JSON.stringify(selection ?? null)} />
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
    </>
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
      <section className={styles.calendar} aria-labelledby="calendar-title">
        <h2 id="calendar-title" tabIndex={-1}>
          Moon calendar
        </h2>
        <script>{activateCalendarShortcut}</script>
        <CalendarForm>
          <Suspense
            fallback={
              <p className={styles.message} role="status">
                Looking up the Moon’s phases…
              </p>
            }
          >
            <CalendarResults searchParams={searchParams} />
          </Suspense>
        </CalendarForm>
      </section>
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
