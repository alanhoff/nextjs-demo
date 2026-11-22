import { expect, type Locator, test } from "@playwright/test";

const describedPlates = [
  {
    slug: "acadia",
    name: "Acadia",
    alt: "Stars over a wooded cove reflected in still water",
    description:
      "A pale band of stars rises near the center of the sky, while dark trees climb the right edge. Rocks break the still water in the foreground.",
  },
  {
    slug: "death-valley",
    name: "Death Valley",
    alt: "Low light grazing the ridges of Mesquite Flat Sand Dunes",
    description:
      "A bright golden crest cuts through the shadowed dunes at the center. Low shrubs fill the foreground, and a hazy mountain ridge rises behind the dunes toward the right.",
  },
];

async function expectDescription(scope: Locator, plate: (typeof describedPlates)[number]) {
  const image = scope.getByRole("img", { name: plate.alt, exact: true });
  const prose = scope.locator("figcaption").getByText(plate.description, { exact: true });
  const id = `plate-description-${plate.slug}`;
  await expect(image).toHaveAttribute("alt", plate.alt);
  await expect(image).toHaveAttribute("aria-describedby", id);
  await expect(prose).toHaveAttribute("id", id);
  await expect(prose).toBeVisible();
  await expect(image).toHaveAccessibleDescription(plate.description);
}

for (const plate of describedPlates) {
  test(`${plate.name} has a visible accessible description on its standalone plate`, async ({
    page,
  }) => {
    await page.goto(`/plates/${plate.slug}`);
    await expectDescription(page.getByRole("main"), plate);
  });

  test(`${plate.name} has a visible accessible description in its dismissible modal`, async ({
    page,
  }) => {
    const sitePath = `/sites/${plate.slug}`;
    await page.goto(sitePath);
    const opener = page.getByRole("link", { name: `Enlarge photo of ${plate.name}` });
    await opener.click();
    const dialog = page.getByRole("dialog", { name: plate.name });
    await expect(dialog).toBeVisible();
    await expectDescription(dialog, plate);

    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(new RegExp(`${sitePath}$`));
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
}

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
