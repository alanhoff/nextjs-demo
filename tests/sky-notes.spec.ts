import { createServer } from "node:http";
import { expect, test } from "@playwright/test";
import phaseArchive from "../app/sky-notes/usno-2026-2028.json";

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

test("the calendar shortcut works on a fresh document without hydration", async ({ page }) => {
  // Block application bundles, not the inline scripts that reveal streamed HTML.
  await page.route("**/_next/static/**/*.js", (route) => route.abort());
  await page.goto("/sky-notes", { waitUntil: "commit" });
  const shortcut = page.getByRole("link", { name: "Skip to moon calendar", exact: true });
  await expect(shortcut).toBeVisible();
  await page.evaluate(() => document.documentElement.setAttribute("data-keyboard-test", "fresh"));

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(shortcut).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Moon calendar", exact: true })).toBeFocused();
  await expect(page).toHaveURL(/\/sky-notes#calendar-title$/);
  await expect(page.locator("html")).toHaveAttribute("data-keyboard-test", "fresh");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Starting date (UTC)")).toBeFocused();
});

test("native keyboard navigation works with only the initial Sky notes shell", async ({ page }) => {
  const path = "/sky-notes?date=2028-12-31";
  await page.route("**/_next/static/**/*.js", (route) => route.abort());
  await page.route(`**${path}`, async (route) => {
    const response = await route.fetch();
    const html = await response.text();
    // Serve the real response up to, but not including, the first streamed segment.
    const tail = html.search(/<div\b[^>]*\bid="S:[^"]+"/);
    expect(tail).toBeGreaterThan(0);
    await route.fulfill({
      status: response.status(),
      contentType: "text/html; charset=utf-8",
      body: html.slice(0, tail),
    });
  });
  await page.goto(path, { waitUntil: "commit" });
  const first = page.getByRole("link", { name: "Skip to content", exact: true });
  await expect(first).toBeVisible();
  await page.evaluate(() => document.documentElement.setAttribute("data-keyboard-test", "shell"));
  const shortcut = page.getByRole("link", { name: "Skip to moon calendar", exact: true });

  await page.keyboard.press("Tab");
  await expect(first).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(shortcut).toBeFocused();
  await expect(shortcut).toBeInViewport({ ratio: 1 });
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Moon calendar", exact: true })).toBeFocused();
  await expect(page).toHaveURL(/\/sky-notes\?date=2028-12-31#calendar-title$/);
  await expect(page.locator("html")).toHaveAttribute("data-keyboard-test", "shell");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Starting date (UTC)")).toBeFocused();
  await expect(page.getByRole("link", { name: "Download lunar calendar" })).toHaveCount(0);
});

for (const query of [
  "",
  "?date=2028-12-31",
  "?date=2028-02-30",
  "?date=not-a-date",
  "?date=2100-01-01",
  "?date=2028-12-31&date=2028-12-31",
]) {
  test(`the streamed native planner initializes without bundles (${query || "today"})`, async ({
    page,
  }) => {
    await page.route("**/_next/static/**/*.js", (route) => route.abort());
    const today = new Date().toISOString().slice(0, 10);
    await page.goto(`/sky-notes${query}`);
    const value = !query ? today : query === "?date=2028-12-31" ? "2028-12-31" : "";
    const field = page.getByLabel("Starting date (UTC)");
    await expect(field).toHaveValue(value);
    await expect(field).toHaveJSProperty("defaultValue", value);
    await expect(field).toHaveJSProperty("required", true);
    await expect(field).toHaveAttribute("min", "1700-01-01");
    await expect(field).toHaveAttribute("max", "2099-12-31");
    await expect(field).toHaveAttribute("aria-invalid", String(!value));
    const phases = page.getByRole("list", { name: "Next four moon phases" }).getByRole("listitem");
    if (!value) {
      await expect(field).toHaveAttribute("aria-describedby", "invalid-date");
      await expect(page.locator("#invalid-date")).toHaveText("Choose a date from 1700 through 2099.");
      await expect(page.locator("#invalid-date")).toBeVisible();
      await expect(phases).toHaveCount(0);
    } else {
      await expect(field).not.toHaveAttribute("aria-describedby", /.+/);
      await expect(phases).toHaveCount(4);
      if (!query) {
        const expected = phaseArchive.filter(({ at }) => at >= today).slice(0, 4);
        const actual = await phases.evaluateAll((items) =>
          items.map((item) => ({
            name: item.querySelector("h3")?.textContent,
            at: item.querySelector("time")?.dateTime ?? "",
          })),
        );
        if (expected.length === 4 && await page.getByText("Source (offline edition):").isVisible()) {
          expect(actual).toEqual(expected);
        }
        let previous = "";
        for (const [index, { name, at }] of actual.entries()) {
          expect(["New Moon", "First Quarter", "Full Moon", "Last Quarter"]).toContain(name);
          expect(at.slice(0, 10) >= value && at > previous).toBe(true);
          await expect(phases.nth(index).locator("time")).toContainText(`${at.slice(11, 16)} UTC`);
          previous = at;
        }
        await field.fill("2028-12-31");
        await page.getByRole("button", { name: "Show phases" }).click();
        await expect(page).toHaveURL(/\/sky-notes\?date=2028-12-31$/);
        await expect(phases).toHaveCount(4);
      }
    }
  });
}

const shellInteractions = [
  ["shortcut", "typed"],
  ["shortcut", "cleared"],
  ["shortcut", "clicked away"],
  ["fragment", "typed"],
  ["fragment", "cleared"],
  ["fragment", "clicked away"],
] as const;
const streamCases = (["ordinary", "gated"] as const).flatMap((schedule) =>
  shellInteractions.map(([entry, edit]) => ({ schedule, entry, edit })),
);

for (const { schedule, entry, edit } of streamCases) {
  test(`a shell edit survives streaming and hydration (${schedule}, ${entry}, ${edit})`, async ({
    page,
    request,
  }) => {
    const path = "/sky-notes?date=2028-12-31";
    let releaseTail = () => {};
    let releaseBundles = () => {};
    const tailReady = new Promise<void>((resolve) => {
      releaseTail = resolve;
    });
    const bundlesReady = new Promise<void>((resolve) => {
      releaseBundles = resolve;
    });
    if (schedule === "gated") {
      await page.route("**/_next/static/**/*.js", async (route) => {
        await bundlesReady;
        await route.continue();
      });
    }
    // Hold actual document bytes, not just execution of an injected parser gate.
    const response = await request.get(path);
    const html = await response.text();
    const tail = html.search(/<div\b[^>]*\bid="S:[^"]+"/);
    expect(tail).toBeGreaterThan(0);
    const server = createServer(async (incoming, outgoing) => {
      try {
        if (incoming.url === path && incoming.headers.rsc !== "1") {
          outgoing.writeHead(response.status(), { "Content-Type": "text/html; charset=utf-8" });
          outgoing.write(html.slice(0, tail));
          await tailReady;
          outgoing.end(html.slice(tail));
          return;
        }
        const upstream = await request.get(incoming.url ?? "/", {
          headers: Object.fromEntries(
            Object.entries(incoming.headers).filter(
              (entry): entry is [string, string] =>
                typeof entry[1] === "string" && !["host", "connection"].includes(entry[0]),
            ),
          ),
        });
        outgoing.writeHead(upstream.status(), {
          "Content-Type": upstream.headers()["content-type"] ?? "application/octet-stream",
        });
        outgoing.end(await upstream.body());
      } catch {
        outgoing.destroy();
      }
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Expected a TCP test server");
      const initialHash = entry === "fragment" ? "#calendar-title" : "";
      await page.goto(`http://127.0.0.1:${address.port}${path}${initialHash}`, {
        waitUntil: "commit",
      });
      const fragmentEvents = await page.evaluateHandle(() => {
        const destinations: string[] = [];
        window.addEventListener("hashchange", (event) => {
          destinations.push(new URL(event.newURL).hash);
        });
        return destinations;
      });
      if (entry === "shortcut") {
        const first = page.getByRole("link", { name: "Skip to content" });
        await expect(first).toBeVisible();
        await page.keyboard.press("Tab");
        await expect(first).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(page.getByRole("link", { name: "Skip to moon calendar" })).toBeFocused();
        await page.keyboard.press("Enter");
      }
      await expect(page.getByRole("heading", { name: "Moon calendar", exact: true })).toBeFocused();
      await expect(page).toHaveURL(/\/sky-notes\?date=2028-12-31#calendar-title$/);
      await page.keyboard.press("Tab");
      const field = page.getByLabel("Starting date (UTC)");
      await expect(field).toBeFocused();
      const originalField = await field.elementHandle();
      for (const digit of "12302028") await page.keyboard.press(digit);
      await expect(field).toHaveValue("2028-12-30");
      const value = edit === "cleared" ? "" : "2028-12-30";
      if (edit === "cleared") await page.keyboard.press("Backspace");
      await expect(field).toHaveValue(value);
      await expect(field).toBeFocused();
      const focused = edit === "clicked away" ? page.locator("body") : field;
      if (edit === "clicked away") {
        await page.getByRole("heading", { name: "Sky notes", exact: true }).click();
      }
      await expect(focused).toBeFocused();
      const focusTransitions = await page.evaluateHandle(() => {
        const transitions: string[] = [];
        document.getElementById("start-date")?.addEventListener("blur", () => {
          transitions.push("date blurred");
        });
        document.getElementById("calendar-title")?.addEventListener("focus", () => {
          transitions.push("heading focused");
        });
        return transitions;
      });
      await expect(page).toHaveURL(/\/sky-notes\?date=2028-12-31#calendar-title$/);
      releaseTail();
      await expect(field).toHaveJSProperty("defaultValue", "2028-12-31");
      await expect(field).toHaveValue(value);
      expect(await field.evaluate((node, original) => node === original, originalField)).toBe(true);
      const streamed = await page.evaluate(() => ({
        activeElement: document.activeElement?.id || document.activeElement?.tagName,
        hash: location.hash,
      }));
      const transitions = await focusTransitions.jsonValue();
      const diagnostic = JSON.stringify({ ...streamed, transitions });
      expect(streamed, diagnostic).toEqual({
        activeElement: edit === "clicked away" ? "BODY" : "start-date",
        hash: "#calendar-title",
      });
      expect(transitions, diagnostic).toEqual([]);
      await expect(focused, diagnostic).toBeFocused();
      releaseBundles();
      await page.waitForLoadState("load");
      await expect(field).toHaveAttribute("data-calendar-initialized", "true");
      expect(await field.evaluate((node, original) => node === original, originalField)).toBe(true);
      await originalField.dispose();
      await expect(field).toHaveValue(value);
      await expect(focused).toBeFocused();

      await expect(page).toHaveURL(/\/sky-notes\?date=2028-12-31#calendar-title$/);
      await expect(focused).toBeFocused();
      expect(await fragmentEvents.jsonValue()).toEqual(entry === "shortcut" ? ["#calendar-title"] : []);
      await fragmentEvents.dispose();
      expect(await focusTransitions.jsonValue()).toEqual([]);
      await focusTransitions.dispose();
      await page.evaluate(() => document.documentElement.setAttribute("data-planner-test", "same"));
      if (entry === "shortcut") {
        await page.goBack();
        await expect(page).toHaveURL(/\/sky-notes\?date=2028-12-31$/);
        await page.goForward();
        await expect(page).toHaveURL(/\/sky-notes\?date=2028-12-31#calendar-title$/);
        await expect(page.getByRole("heading", { name: "Moon calendar", exact: true })).toBeFocused();
      }
      await expect(page.locator("html")).toHaveAttribute("data-planner-test", "same");
      await expect(field).toHaveValue(value);
      await field.fill("2028-12-29");
      const submit = page.getByRole("button", { name: "Show phases" });
      await submit.click();
      await expect(page).toHaveURL(/\/sky-notes\?date=2028-12-29$/);
      await expect(page.locator("html")).toHaveAttribute("data-planner-test", "same");
      await expect(field).toHaveJSProperty("defaultValue", "2028-12-29");
      await expect(field).toHaveValue("2028-12-29");
      await expect(submit).toBeFocused();

      // A different search date must override a dirty field on history traversal.
      await field.fill("2028-12-28");
      await page.goBack();
      await expect(page).toHaveURL(/\/sky-notes\?date=2028-12-31#calendar-title$/);
      await expect(field).toHaveJSProperty("defaultValue", "2028-12-31");
      await expect(field).toHaveValue("2028-12-31");
      await page.goForward();
      await expect(page).toHaveURL(/\/sky-notes\?date=2028-12-29$/);
      await expect(field).toHaveValue("2028-12-29");
      await expect(page.locator("html")).toHaveAttribute("data-planner-test", "same");
    } finally {
      releaseTail();
      releaseBundles();
      server.close();
      server.closeAllConnections();
    }
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

test("the server shortcut slot follows navigation between the atlas and Sky notes", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  const shortcut = page.getByRole("link", { name: "Skip to moon calendar" });
  await nav.getByRole("link", { name: "Sky notes" }).click();
  await expect(page).toHaveURL(/\/sky-notes$/);
  await expect(shortcut).toHaveCount(1);
  await nav.getByRole("link", { name: "Atlas" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(shortcut).toHaveCount(0);
});

test("the moon calendar crosses year-end and rejects impossible dates", async ({ page }) => {
  await page.goto("/sky-notes?date=2028-02-30");
  await expect(page.getByText("Choose a date from 1700 through 2099.")).toBeVisible();
  const date = page.getByLabel("Starting date (UTC)");
  await expect(date).toHaveAttribute("aria-invalid", "true");
  await expect(date).toHaveValue("");
  await expect(date).toHaveAttribute("data-calendar-initialized", "true");
  await page.evaluate(() => document.documentElement.setAttribute("data-planner-test", "same"));
  await date.fill("2028-12-31");
  const submit = page.getByRole("button", { name: "Show phases" });
  await page.keyboard.press("Tab");
  await expect(submit).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(date).toHaveAttribute("aria-invalid", "false");
  await expect(date).toHaveValue("2028-12-31");
  await expect(date).toHaveJSProperty("defaultValue", "2028-12-31");
  await expect(date).not.toHaveAttribute("aria-describedby", /.+/);
  const phases = page.getByRole("list", { name: "Next four moon phases" }).getByRole("listitem");
  await expect(phases).toHaveCount(4);
  await expect(submit).toBeFocused();
  await expect(phases.first().locator("time")).toHaveAttribute("datetime", "2028-12-31T16:48:00Z");
  await expect(phases.last().locator("time")).toHaveAttribute("datetime", "2029-01-22T19:23:00Z");
  const download = page.getByRole("link", { name: "Download lunar calendar" });
  await expect(download).toBeVisible();
  await expect(download).toHaveAttribute("href", "/sky-notes/calendar.ics?date=2028-12-31");

  await date.fill("2028-12-29");
  await page.goBack();
  await expect(page).toHaveURL(/\/sky-notes\?date=2028-02-30$/);
  await expect(page.locator("html")).toHaveAttribute("data-planner-test", "same");
  await expect(date).toHaveValue("");
  await expect(date).toHaveJSProperty("defaultValue", "");
  await expect(date).toHaveAttribute("aria-invalid", "true");
  await expect(date).toHaveAttribute("aria-describedby", "invalid-date");
  await expect(page.locator("#invalid-date")).toBeVisible();

  await date.fill("2028-12-30");
  await page.goForward();
  await expect(page).toHaveURL(/\/sky-notes\?date=2028-12-31$/);
  await expect(page.locator("html")).toHaveAttribute("data-planner-test", "same");
  await expect(date).toHaveValue("2028-12-31");
  await expect(date).toHaveJSProperty("defaultValue", "2028-12-31");
  await expect(date).toHaveAttribute("aria-invalid", "false");
  await expect(date).not.toHaveAttribute("aria-describedby", /.+/);
  await expect(page.locator("#invalid-date")).toHaveCount(0);
  await expect(phases).toHaveCount(4);
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
