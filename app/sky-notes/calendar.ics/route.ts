import { isPlannerDate, upcomingPhases } from "../phases";

function calendarTimestamp(iso: string) {
  return iso.replace(/\.\d{3}Z$/, "Z").replace(/[-:]/g, "");
}

export async function GET(request: Request) {
  const dates = new URL(request.url).searchParams.getAll("date");
  const [date] = dates;
  if (dates.length !== 1 || !isPlannerDate(date)) {
    return new Response("Supply one valid date (YYYY-MM-DD) from 1700 through 2099.", {
      status: 400,
    });
  }

  const { phases } = await upcomingPhases(date);
  if (phases.length !== 4) {
    return new Response("The observatory table is unavailable. Try again later.", { status: 503 });
  }

  const stamp = calendarTimestamp(new Date().toISOString());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Night Atlas//Lunar Phases//EN"];
  for (const { at, name } of phases) {
    const start = calendarTimestamp(at);
    lines.push(
      "BEGIN:VEVENT",
      `UID:lunar-phase-${start}@night-atlas`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}`,
      `SUMMARY:${name}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR", "");

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="lunar-phases-${date}.ics"`,
    },
  });
}
