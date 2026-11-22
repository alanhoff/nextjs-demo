import { expect, test } from "@playwright/test";

test("home catalog link downloads sites.csv even when the directory is filtered", async ({
  page,
}) => {
  await page.goto("/?region=West#sites");
  const link = page.locator("#sites").getByRole("link", {
    name: "Download site catalog (CSV)",
    exact: true,
  });
  await expect(link).toHaveAttribute("href", "/api/sites.csv");

  const [download] = await Promise.all([page.waitForEvent("download"), link.click()]);
  expect(download.suggestedFilename()).toBe("sites.csv");
});

for (const width of [320, 390, 768, 1440]) {
  test(`catalog action targets are separated at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#sites");
    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    const directory = page.locator("#sites");
    const compare = directory.getByRole("link", { name: "Compare sites", exact: true });
    const csv = directory.getByRole("link", { name: "Download site catalog (CSV)", exact: true });
    const filters = directory.getByRole("navigation", { name: "Filter by region" });
    await expect(compare).toHaveAttribute("href", "/compare");
    await expect(csv).toHaveAttribute("href", "/api/sites.csv");
    const [first, second, filterRow] = await Promise.all([
      compare.boundingBox(),
      csv.boundingBox(),
      filters.boundingBox(),
    ]);
    if (!first || !second || !filterRow) throw new Error("Missing catalog controls");

    const verticalGap = second.y - (first.y + first.height);
    if (width === 320 || second.y > first.y) {
      expect(verticalGap).toBeGreaterThanOrEqual(8);
    } else {
      expect(second.x - (first.x + first.width)).toBeGreaterThanOrEqual(8);
    }
    expect(
      filterRow.y - Math.max(first.y + first.height, second.y + second.height),
    ).toBeGreaterThanOrEqual(8);
    for (const target of [first, second]) {
      expect(target.x).toBeGreaterThanOrEqual(0);
      expect(target.x + target.width).toBeLessThanOrEqual(width);
      if (width <= 390) expect(target.height).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}

test("desktop catalog actions show clear keyboard focus and Enter downloads the CSV", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#sites");
  const origin = page.url();
  const directory = page.locator("#sites");
  await directory.getByRole("button", { name: "Search sites" }).focus();

  for (const name of ["Compare sites", "Download site catalog (CSV)"]) {
    const link = directory.getByRole("link", { name, exact: true });
    await page.keyboard.press("Tab");
    await expect(link).toBeFocused();
    await link.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await expect(link).toHaveCSS("outline-style", "solid");
    await expect(link).toHaveCSS("outline-width", "3px");
    expect(
      await link.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const outset = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
        const left = rect.left - outset;
        const right = rect.right + outset;
        const top = rect.top - outset;
        const bottom = rect.bottom + outset;
        if (left < 0 || right > innerWidth || top < 0 || bottom > innerHeight) return false;
        for (let parent = element.parentElement; parent; parent = parent.parentElement) {
          const bounds = parent.getBoundingClientRect();
          const { overflowX, overflowY } = getComputedStyle(parent);
          if (overflowX !== "visible" && (left < bounds.left || right > bounds.right)) return false;
          if (overflowY !== "visible" && (top < bounds.top || bottom > bounds.bottom)) return false;
        }
        return Array.from(document.querySelectorAll("#sites :is(a, button, input)")).every(
          (control) => {
            if (control === element) return true;
            const bounds = control.getBoundingClientRect();
            return (
              right <= bounds.left ||
              left >= bounds.right ||
              bottom <= bounds.top ||
              top >= bounds.bottom
            );
          },
        );
      }),
    ).toBe(true);
  }

  const [download] = await Promise.all([page.waitForEvent("download"), page.keyboard.press("Enter")]);
  expect(download.suggestedFilename()).toBe("sites.csv");
  await expect(page).toHaveURL(origin);
});

test.describe("touch catalog download", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test("tapping the CSV link downloads without leaving the catalog", async ({ page }) => {
    await page.goto("/#sites");
    const origin = page.url();
    const link = page.locator("#sites").getByRole("link", {
      name: "Download site catalog (CSV)",
      exact: true,
    });
    const [download] = await Promise.all([page.waitForEvent("download"), link.tap()]);
    expect(download.suggestedFilename()).toBe("sites.csv");
    await expect(page).toHaveURL(origin);
  });
});

test("sites CSV downloads the complete catalog in order", async ({ request }) => {
  const response = await request.get("/api/sites.csv");
  expect(response.status()).toBe(200);

  const headers = response.headersArray();
  expect(
    headers.filter(({ name }) => name.toLowerCase() === "content-type").map(({ value }) => value),
  ).toEqual(["text/csv; charset=utf-8"]);
  expect(
    headers
      .filter(({ name }) => name.toLowerCase() === "content-disposition")
      .map(({ value }) => value),
  ).toEqual(['attachment; filename="sites.csv"']);

  const expected = [
    "code,slug,name",
    "JOTR,joshua-tree,Joshua Tree",
    "BIBE,big-bend,Big Bend",
    "BRCA,bryce-canyon,Bryce Canyon",
    "GRBA,great-basin,Great Basin",
    "DEVA,death-valley,Death Valley",
    "ACAD,acadia,Acadia",
    "",
  ].join("\r\n");
  expect(await response.body()).toEqual(Buffer.from(expected, "utf8"));
});

for (const { query, rows } of [
  {
    query: "West",
    rows: [
      "JOTR,joshua-tree,Joshua Tree",
      "GRBA,great-basin,Great Basin",
      "DEVA,death-valley,Death Valley",
    ],
  },
  {
    query: "%20sOuThWeSt%20",
    rows: ["BIBE,big-bend,Big Bend", "BRCA,bryce-canyon,Bryce Canyon"],
  },
  { query: "Atlantis", rows: [] },
]) {
  test(`sites CSV filters by region ${query}`, async ({ request }) => {
    const response = await request.get(`/api/sites.csv?region=${query}`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("text/csv; charset=utf-8");
    expect(response.headers()["content-disposition"]).toBe('attachment; filename="sites.csv"');
    expect(await response.text()).toBe(["code,slug,name", ...rows, ""].join("\r\n"));
  });
}
