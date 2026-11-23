import { expect, test } from "@playwright/test";

for (const { slug, width, height, coordinates } of [
  { slug: "acadia", width: 390, height: 844, coordinates: "44.330° N, 68.184° W" },
  { slug: "bryce-canyon", width: 1440, height: 900, coordinates: "37.595° N, 112.171° W" },
]) {
  test(`coordinate help on ${slug} follows hover and focus without activating`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const path = `/sites/${slug}`;
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    const button = page.getByRole("button", { name: "Show decimal coordinates", exact: true });
    const description = "Latitude comes first; negative values mean south or west.";
    const hint = page.getByText(description, { exact: true });
    const compass = page.getByText(coordinates, { exact: true });
    const shortLink = page.getByText(/Short link:/);
    const photo = page.getByRole("link", { name: /Enlarge photo of/ });
    await button.scrollIntoViewIfNeeded();
    await expect(hint).toBeHidden();
    await expect(button).toHaveAccessibleDescription(description);
    const layout = () => Promise.all([button.boundingBox(), compass.boundingBox(), shortLink.boundingBox()]);
    const before = await layout();

    await button.hover();
    await expect(hint).toBeVisible();
    expect(await layout()).toEqual(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const hintBox = await hint.boundingBox();
    const [buttonBox] = before;
    if (!hintBox || !buttonBox) throw new Error("Expected visible coordinate help and button");
    expect(hintBox.x).toBeGreaterThanOrEqual(0);
    expect(hintBox.x + hintBox.width).toBeLessThanOrEqual(width);
    expect(hintBox.y).toBeGreaterThanOrEqual(0);
    expect(hintBox.y + hintBox.height).toBeLessThanOrEqual(height);
    for (const neighbor of [
      button,
      compass,
      shortLink,
      page.getByText("Viewing spot", { exact: true }),
      page.getByRole("heading", { name: slug === "acadia" ? "Sand Beach" : "Paria View" }),
      page.getByRole("link", { name: "Compare this site" }),
    ]) {
      const box = await neighbor.boundingBox();
      if (!box) throw new Error("Expected visible neighboring content");
      expect(
        hintBox.x < box.x + box.width &&
          hintBox.x + hintBox.width > box.x &&
          hintBox.y < box.y + box.height &&
          hintBox.y + hintBox.height > box.y,
      ).toBe(false);
    }

    const x = buttonBox.x + buttonBox.width / 2;
    await page.mouse.move(x, hintBox.y + hintBox.height / 2, { steps: 20 });
    await expect(hint).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(hint).toBeHidden();
    await page.mouse.move(0, 0);
    await expect(hint).toBeHidden();

    await button.hover();
    await page.keyboard.press("Escape");
    await expect(hint).toBeHidden();
    await expect(button).not.toBeFocused();
    expect(await layout()).toEqual(before);
    await page.mouse.move(0, 0);
    await button.hover();
    await expect(hint).toBeVisible();
    await page.mouse.move(0, 0);

    await photo.focus();
    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    await expect(hint).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(hint).toBeHidden();
    await expect(button).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(button).toBeFocused();
    await expect(hint).toBeVisible();
    await button.hover();
    await page.mouse.move(0, 0);
    await expect(hint).toBeVisible();
    await button.hover();
    await page.keyboard.press("Tab");
    await expect(button).not.toBeFocused();
    await expect(hint).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(hint).toBeHidden();
    await expect(compass).toBeVisible();
    await expect(button).toBeVisible();
    await expect(page).toHaveURL(path);
  });
}

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
