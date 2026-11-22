import { expect, test } from "@playwright/test";

test("the catalog formats guide matches live export discovery", async ({ request }) => {
  const response = await request.get("/guides/catalog-formats.md");
  expect(response.status()).toBe(200);
  const guide = await response.text();
  expect(guide).toMatch(/^# Catalog export formats\r?\n/);

  const discovery = await request.get("/api/sites/exports");
  expect(discovery.status()).toBe(200);
  const { formats } = await discovery.json();
  expect(formats.length).toBeGreaterThan(0);

  const documented = Array.from(
    guide.matchAll(/^\| [^|]+ \| `([^`]+)` \| `([^`]+)` \|/gm),
    ([, path, media_type]) => ({ path, media_type }),
  );
  expect(documented).toHaveLength(formats.length);
  for (const { path, media_type } of formats) {
    expect(documented).toContainEqual({ path, media_type });
  }
});
