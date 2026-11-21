import { expect, test } from "@playwright/test";

test("compare two sites from the directory on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("link", { name: "Compare sites" }).click();
  await page.getByLabel("Left site").selectOption("acadia");
  await page.getByLabel("Right site").selectOption("big-bend");
  await page.getByRole("button", { name: "Compare sites" }).click();
  await expect(page).toHaveURL(/\/compare\?left=acadia&right=big-bend$/);
  await page.reload();
  const results = page.getByRole("region", { name: "Comparison results" });
  for (const text of [
    "Acadia",
    "Maine",
    "Sand Beach",
    "44.330° N, 68.184° W",
    "Big Bend",
    "Texas",
    "Sotol Vista",
    "29.215° N, 103.377° W",
  ]) {
    await expect(results.getByText(text, { exact: true })).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("shared comparison shows site headings before the select options", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/compare?left=acadia&right=big-bend");
  for (const name of ["Acadia", "Big Bend"]) {
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByLabel("Left site")).toHaveValue("acadia");
  await expect(page.getByLabel("Right site")).toHaveValue("big-bend");
});

for (const [query, message] of [
  ["left=acadia&right=acadia", "Choose two different sites"],
  ["left=typo&right=acadia", "Unknown site"],
  ["left=acadia&left=big-bend&right=acadia", "Unknown site"],
]) {
  test(`rejects comparison query ${query}`, async ({ page }) => {
    const response = await page.goto(`/compare?${query}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByText(message)).toBeVisible();
    await expect(page.getByRole("region", { name: "Comparison results" })).toHaveCount(0);
  });
}
