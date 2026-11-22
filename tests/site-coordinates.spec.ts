import { expect, test } from "@playwright/test";

test("viewing spot coordinates toggle both ways with the keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const path = "/sites/bryce-canyon";
  await page.goto(path);

  const viewpoint = page.getByRole("heading", { name: "Paria View" });
  const compass = page.getByText("37.595° N, 112.171° W", { exact: true });
  const decimal = page.getByText("37.595, -112.171", { exact: true });
  const showDecimal = page.getByRole("button", { name: "Show decimal coordinates" });
  const showCompass = page.getByRole("button", { name: "Show compass coordinates" });

  await expect(compass).toBeVisible();
  await showDecimal.focus();
  await page.keyboard.press("Enter");
  await expect(decimal).toBeVisible();
  await expect(compass).toBeHidden();
  await expect(showCompass).toBeFocused();
  await expect(viewpoint).toBeVisible();
  await expect(page).toHaveURL(path);

  await page.keyboard.press("Space");
  await expect(compass).toBeVisible();
  await expect(decimal).toBeHidden();
  await expect(showDecimal).toBeFocused();
  await expect(viewpoint).toBeVisible();
  await expect(page).toHaveURL(path);

  await page.keyboard.press("Enter");
  await expect(decimal).toBeVisible();
  await page.reload();
  await expect(compass).toBeVisible();
  await expect(showDecimal).toBeVisible();
});
