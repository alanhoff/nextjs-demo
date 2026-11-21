import { cacheLife } from "next/cache";
import archive from "./usno-2026-2028.json";

const names = ["New Moon", "First Quarter", "Full Moon", "Last Quarter"];
type Phase = { at: string; name: string };

export function isPlannerDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return (
    value >= "1700-01-01" &&
    value <= "2099-12-31" &&
    Number.isFinite(date.getTime()) &&
    date.toISOString().startsWith(value)
  );
}

function readPhase(row: unknown): Phase {
  if (
    !row ||
    typeof row !== "object" ||
    !("year" in row && "month" in row && "day" in row && "time" in row && "phase" in row)
  )
    throw new Error("Missing phase fields");

  const day = [row.year, String(row.month).padStart(2, "0"), String(row.day).padStart(2, "0")].join(
    "-",
  );
  const at = `${day}T${row.time}:00Z`;
  if (
    typeof row.phase !== "string" ||
    !names.includes(row.phase) ||
    typeof row.time !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(row.time) ||
    !Number.isFinite(Date.parse(at)) ||
    !new Date(at).toISOString().startsWith(day)
  ) {
    throw new Error("Invalid phase data");
  }
  return { at, name: row.phase };
}

async function getMonth(month: string) {
  "use cache";

  try {
    // A month can contain five phases; nine covers the next four even on the last day.
    const url = `https://aa.usno.navy.mil/api/moon/phases/date?date=${month}-01&nump=9`;
    const response = await fetch(url, { signal: AbortSignal.timeout(2400) });
    if (!response.ok) throw new Error("USNO unavailable");
    const { phasedata } = await response.json();
    if (!Array.isArray(phasedata) || phasedata.length !== 9)
      throw new Error("Incomplete phase table");
    const phases: Phase[] = phasedata.map(readPhase);
    if (
      !phases[0].at.startsWith(month) ||
      phases.some((phase, i) => i > 0 && phase.at <= phases[i - 1].at)
    ) {
      throw new Error("Unexpected phase dates");
    }
    cacheLife("days");
    return phases;
  } catch {
    // A failed lookup should be retried sooner than a verified ephemeris.
    cacheLife("minutes");
    return null;
  }
}

export async function upcomingPhases(date: string) {
  const online = await getMonth(date.slice(0, 7));
  const hasArchive = date >= "2026-01-01" && date <= "2028-12-31";
  const table = online ?? (hasArchive ? archive : []);
  return {
    phases: table.filter(({ at }) => at >= date).slice(0, 4),
    archived: !online && hasArchive,
  };
}
