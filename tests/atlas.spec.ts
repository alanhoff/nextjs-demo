import { expect, test } from "@playwright/test";

test("combine catalog filters and reject unknown regions", async ({ request }) => {
  const response = await request.get("/api/sites?region=west&q=california");
  expect(response.ok()).toBe(true);
  const { sites } = await response.json();
  expect(sites.map((site: { name: string }) => site.name)).toEqual(["Joshua Tree", "Death Valley"]);

  const invalid = await request.get("/api/sites?region=moon");
  expect(invalid.status()).toBe(400);
  expect(await invalid.json()).toMatchObject({ error: expect.any(String) });
});

test("a field record can be saved, revisited, and removed", async ({ page, browser, baseURL }) => {
  await page.goto("/sites/joshua-tree");
  await page.getByRole("button", { name: "Save Joshua Tree to logbook" }).click();
  await expect(page.getByRole("button", { name: "Remove Joshua Tree from logbook" })).toBeVisible();
  await page.goto("/logbook");
  await expect(page.getByRole("link", { name: /Joshua Tree/ })).toBeVisible();

  const visitor = await browser.newContext({ baseURL });
  try {
    const blankLogbook = await visitor.newPage();
    await blankLogbook.goto("/logbook");
    await expect(blankLogbook.getByRole("heading", { name: "No saved sites yet" })).toBeVisible();
  } finally {
    await visitor.close();
  }

  await page.getByRole("button", { name: "Remove Joshua Tree from logbook" }).click();
  await expect(page.getByRole("heading", { name: "No saved sites yet" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: /Joshua Tree/ })).toHaveCount(0);
});

test("region and search survive navigation and can be cleared", async ({ page }) => {
  await page.goto("/");
  const index = page.getByRole("region", { name: "Site directory" });
  await index.getByRole("link", { name: "West", exact: true }).click();
  await expect(index.getByRole("heading", { level: 3 })).toHaveCount(3);

  const search = index.getByRole("searchbox", { name: "Search parks or states" });
  await search.fill("California");
  await search.press("Enter");
  await expect(index.getByRole("heading", { level: 3 })).toHaveText([
    "Joshua Tree",
    "Death Valley",
  ]);
  await page.reload();
  await expect(search).toHaveValue("California");
  await index.getByRole("link", { name: "Northeast", exact: true }).click();
  await expect(index.getByRole("heading", { name: "No matching sites" })).toBeVisible();
  await page.goBack();
  await expect(index.getByRole("heading", { level: 3 })).toHaveCount(2);
  await expect(search).toHaveValue("California");
  await page.goForward();
  await index.getByRole("link", { name: "Clear filters" }).click();
  await expect(index.getByRole("heading", { level: 3 })).toHaveCount(6);
});

test("an unknown site is not indexed or offered for bookmarking", async ({ page }) => {
  await page.goto("/sites/not-in-the-atlas");
  await expect(page.getByRole("heading", { name: "Site not found" })).toBeVisible();
  await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
  await expect(page.getByRole("button", { name: /to logbook/i })).toHaveCount(0);
});
