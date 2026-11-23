import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`the calendar shortcut moves keyboard focus to the planner at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/sky-notes");
    const heading = page.getByRole("heading", { name: "Moon calendar", exact: true });
    await expect(heading).toBeVisible();
    const shortcut = page.getByRole("link", { name: "Skip to moon calendar", exact: true });
    await expect(shortcut).not.toBeInViewport();

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(shortcut).toBeFocused();
    await expect(shortcut).toBeInViewport({ ratio: 1 });

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/sky-notes#calendar-title$/);
    await expect(heading).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Starting date (UTC)")).toBeFocused();
  });
}

test("the atlas keeps its original skip link before the masthead", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Skip to moon calendar", exact: true })).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Night Atlas home" })).toBeFocused();
});

test("the moon calendar crosses year-end and rejects impossible dates", async ({ page }) => {
  await page.goto("/sky-notes?date=2028-02-30");
  await expect(page.getByText("Choose a date from 1700 through 2099.")).toBeVisible();
  await page.getByLabel("Starting date (UTC)").fill("2028-12-31");
  await page.getByRole("button", { name: "Show phases" }).click();
  const phases = page.getByRole("list", { name: "Next four moon phases" }).getByRole("listitem");
  await expect(phases).toHaveCount(4);
  await expect(phases.first().locator("time")).toHaveAttribute("datetime", "2028-12-31T16:48:00Z");
  await expect(phases.last().locator("time")).toHaveAttribute("datetime", "2029-01-22T19:23:00Z");
  const download = page.getByRole("link", { name: "Download lunar calendar" });
  await expect(download).toBeVisible();
  await expect(download).toHaveAttribute("href", "/sky-notes/calendar.ics?date=2028-12-31");
});

test("the lunar calendar exports four UTC events with stable UIDs", async ({ request }) => {
  const endpoint = "/sky-notes/calendar.ics";
  const response = await request.get(`${endpoint}?date=2026-01-15`);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/calendar");
  expect(response.headers()["content-disposition"]).toContain("attachment");
  const lines = (await response.text()).split("\r\n");
  expect(lines.slice(0, 2)).toEqual(["BEGIN:VCALENDAR", "VERSION:2.0"]);
  expect(lines.slice(-2)).toEqual(["END:VCALENDAR", ""]);
  expect(lines.filter((line) => line === "BEGIN:VEVENT")).toHaveLength(4);
  expect(lines.filter((line) => line === "END:VEVENT")).toHaveLength(4);
  const starts = lines.filter((line) => line.startsWith("DTSTART:"));
  expect(starts).toHaveLength(4);
  expect(starts[0]).toBe("DTSTART:20260118T195200Z");
  expect(starts[3]).toBe("DTSTART:20260209T124300Z");
  expect(lines.filter((line) => line.startsWith("SUMMARY:"))).toEqual([
    "SUMMARY:New Moon",
    "SUMMARY:First Quarter",
    "SUMMARY:Full Moon",
    "SUMMARY:Last Quarter",
  ]);
  expect(lines.filter((line) => /^DTSTAMP:\d{8}T\d{6}Z$/.test(line))).toHaveLength(4);
  const uids = lines.filter((line) => line.startsWith("UID:"));
  expect(new Set(uids).size).toBe(4);
  const overlapping = await request.get(`${endpoint}?date=2026-01-16`);
  expect(overlapping.status()).toBe(200);
  expect((await overlapping.text()).split("\r\n").filter((line) => line.startsWith("UID:"))).toEqual(
    uids,
  );
});

test("the lunar calendar export requires one valid date", async ({ request }) => {
  for (const query of ["", "?date=2026-02-30", "?date=2026-01-15&date=2026-01-16"]) {
    const response = await request.get(`/sky-notes/calendar.ics${query}`);
    expect(response.status()).toBe(400);
  }
});
