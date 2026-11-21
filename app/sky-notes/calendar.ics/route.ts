import { isPlannerDate, upcomingPhases } from "../phases";

function calendarTime(iso: string) {
  return iso.slice(0, 19).replace(/[-:]/g, "") + "Z";
}

export async function GET(request: Request) {
  const dates = new URL(request.url).searchParams.getAll("date");
  const [date] = dates;
  if (dates.length !== 1 || !isPlannerDate(date)) {
    return new Response("Choose one date from 1700 through 2099 in YYYY-MM-DD format.", {
      status: 400,
    });
  }

  const { phases } = await upcomingPhases(date);
  if (phases.length !== 4) {
    return new Response("The observatory table is unavailable. Try again later.", { status: 503 });
  }

  const stamp = calendarTime(new Date().toISOString());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Night Atlas//Lunar Calendar//EN"];
  for (const { at, name } of phases) {
    const start = calendarTime(at);
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
