import { expect, test } from "@playwright/test";
import { sites } from "../lib/catalog";

for (const { code, slug, name } of sites) {
  const alias = `/parks/${code}`;
  const canonical = `/sites/${slug}`;

  test(`${alias} sends one relative redirect on GET and HEAD`, async ({ request }) => {
    for (const method of ["GET", "HEAD"]) {
      const response = await request.fetch(alias, { method, maxRedirects: 0 });
      expect(response.status()).toBe(308);
      const locations = response.headersArray().filter(({ name }) => name.toLowerCase() === "location");
      expect(locations.map(({ value }) => value)).toEqual([canonical]);
    }
  });

  test(`${alias} opens the canonical site page`, async ({ page }) => {
    await page.goto(alias);
    await expect(page).toHaveURL(canonical);
    await expect(page.getByRole("heading", { level: 1, name, exact: true })).toBeVisible();
  });
}

test("unknown /parks codes return 404 without redirecting", async ({ request }) => {
  for (const method of ["GET", "HEAD"]) {
    const response = await request.fetch("/parks/ZZZZ", { method, maxRedirects: 0 });
    expect(response.status()).toBe(404);
    expect(response.headers().location).toBeUndefined();
  }
});

test("a mixed-case park code redirects permanently without losing query parameters", async ({
  request,
  baseURL,
}) => {
  const response = await request.get("/go/jOtR?from=field&tag=a&tag=b", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(new URL(response.headers().location, baseURL).href).toBe(
    new URL("/sites/joshua-tree?from=field&tag=a&tag=b", baseURL).href,
  );
  expect((await request.get("/go/NOPE")).status()).toBe(404);
});
