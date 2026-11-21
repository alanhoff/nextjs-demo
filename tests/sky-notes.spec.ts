import { expect, test } from "@playwright/test";

test("the moon calendar crosses year-end and rejects impossible dates", async ({ page }) => {
  await page.goto("/sky-notes?date=2028-02-30");
  await expect(page.getByText("Choose a date from 1700 through 2099.")).toBeVisible();
  await page.getByLabel("Starting date (UTC)").fill("2028-12-31");
  await page.getByRole("button", { name: "Show phases" }).click();
  const phases = page.getByRole("list", { name: "Next four moon phases" }).getByRole("listitem");
  await expect(phases).toHaveCount(4);
  const download = page.getByRole("link", { name: "Download lunar phases (.ics)" });
  await expect(download).toBeVisible();
  await expect(download).toHaveAttribute("href", "/sky-notes/calendar.ics?date=2028-12-31");
  await expect(phases.first().locator("time")).toHaveAttribute("datetime", "2028-12-31T16:48:00Z");
  await expect(phases.last().locator("time")).toHaveAttribute("datetime", "2029-01-22T19:23:00Z");
});

test("the lunar download exports four UTC events with stable identities", async ({ request }) => {
  const url = "/sky-notes/calendar.ics?date=2026-01-15";
  const response = await request.get(url);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/calendar");
  expect(response.headers()["content-disposition"]).toContain("attachment");
  const body = await response.text();
  expect(body).toMatch(/^BEGIN:VCALENDAR\r\nVERSION:2\.0\r\nPRODID:/);
  expect(body.endsWith("END:VCALENDAR\r\n")).toBe(true);
  const events = [...body.matchAll(/^BEGIN:VEVENT\r\n([\s\S]*?)^END:VEVENT\r\n/gm)];
  expect(events.map(([, event]) => event.match(/^DTSTART:.*\r\nSUMMARY:.*$/m)?.[0])).toEqual([
    "DTSTART:20260118T195200Z\r\nSUMMARY:New Moon",
    "DTSTART:20260126T044700Z\r\nSUMMARY:First Quarter",
    "DTSTART:20260201T220900Z\r\nSUMMARY:Full Moon",
    "DTSTART:20260209T124300Z\r\nSUMMARY:Last Quarter",
  ]);
  expect(body.match(/^DTSTAMP:\d{8}T\d{6}Z\r$/gm)).toHaveLength(4);
  const uids = body.match(/^UID:.+/gm);
  expect(uids).toHaveLength(4);
  expect(new Set(uids).size).toBe(4);
  const overlapping = await request.get("/sky-notes/calendar.ics?date=2026-01-16");
  expect((await overlapping.text()).match(/^UID:.+/gm)).toEqual(uids);
});

test("the lunar download requires exactly one valid date", async ({ request }) => {
  for (const query of [
    "",
    "?date=2026-02-30",
    "?date=2026-1-15",
    "?date=2026-01-15&date=2026-01-26",
  ]) {
    const response = await request.get(`/sky-notes/calendar.ics${query}`);
    expect(response.status(), query || "missing date").toBe(400);
  }
});
