import { expect, test } from "@playwright/test";

test("the directory leads to a shareable comparison on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("link", { name: "Compare sites" }).click();

  const results = page.getByRole("region", { name: "Field comparison" });
  await expect(results).toHaveCount(0);
  await page.getByLabel("Left site").selectOption("acadia");
  await page.getByLabel("Right site").selectOption("big-bend");
  await page.getByRole("button", { name: "Compare sites" }).click();
  await expect(page).toHaveURL(/\/compare\?left=acadia&right=big-bend$/);
  await expect(page).toHaveTitle("Acadia vs. Big Bend · Night Atlas");
  await page.reload();
  await expect(page).toHaveTitle("Acadia vs. Big Bend · Night Atlas");

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

for (const [query, left, right] of [
  ["left=bryce-canyon&right=joshua-tree", "Bryce Canyon", "Joshua Tree"],
  ["left=big-bend&right=acadia", "Big Bend", "Acadia"],
]) {
  test(`a comparison deep link preserves site order (${query})`, async ({ page }) => {
    await page.goto(`/compare?${query}`);
    await expect(page).toHaveTitle(`${left} vs. ${right} · Night Atlas`);
    const results = page.getByRole("region", { name: "Field comparison" });
    await expect(results.getByRole("heading", { level: 2 })).toHaveText([left, right]);
  });
}

for (const [query, message] of [
  ["", "Select two sites to compare"],
  ["left=acadia", "Select two sites to compare"],
  ["left=acadia&right=acadia", "Choose two different sites"],
  ["left=typo&right=acadia", "Unknown site"],
  ["left=acadia&left=big-bend&right=acadia", "Unknown site"],
  ["left=acadia&right=big-bend&right=joshua-tree", "Unknown site"],
]) {
  test(`comparison without a valid pair (${query || "no query"}) uses the fallback title`, async ({ page }) => {
    await page.goto(query ? `/compare?${query}` : "/compare");
    await expect(page).toHaveTitle("Compare sites · Night Atlas");
    await expect(page.getByText(message, { exact: false })).toBeVisible();
    await expect(page.getByRole("region", { name: "Field comparison" })).toHaveCount(0);
  });
}
