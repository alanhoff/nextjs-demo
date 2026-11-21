import { expect, test } from "@playwright/test";

test("the moon calendar crosses year-end and rejects impossible dates", async ({ page }) => {
  await page.goto("/sky-notes?date=2028-02-30");
  await expect(page.getByText("Choose a date from 1700 through 2099.")).toBeVisible();
  await page.getByLabel("Starting date (UTC)").fill("2028-12-31");
  await page.getByRole("button", { name: "Show phases" }).click();
  const phases = page.getByRole("list", { name: "Next four moon phases" }).getByRole("listitem");
  await expect(phases).toHaveCount(4);
  await expect(phases.first().locator("time")).toHaveAttribute("datetime", "2028-12-31T16:48:00Z");
  await expect(phases.last().locator("time")).toHaveAttribute("datetime", "2029-01-22T19:23:00Z");
});
