import { expect, test } from "@playwright/test";

test("a photo opens over its site, but its URL also stands alone", async ({ page }) => {
  await page.goto("/sites/bryce-canyon");
  await page.getByRole("link", { name: /enlarge photo/i }).click();
  await expect(page.getByRole("dialog", { name: "Bryce Canyon" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/sites\/bryce-canyon$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await expect(page.getByRole("link", { name: "Enlarge photo of Bryce Canyon" })).toBeFocused();

  await page.goto("/plates/bryce-canyon");
  await expect(page.getByRole("heading", { name: "Bryce Canyon", level: 1 })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
