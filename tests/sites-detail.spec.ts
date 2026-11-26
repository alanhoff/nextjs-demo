import { expect, test } from "@playwright/test";
import type { Site } from "../lib/catalog";

test("site detail returns the full collection row for a published slug", async ({ request }) => {
  const collection = await request.get("/api/sites");
  expect(collection.status()).toBe(200);
  const { sites }: { sites: Site[] } = await collection.json();
  const row = sites.find(({ slug }) => slug === "joshua-tree");
  expect(row).toBeDefined();

  const path = "/api/sites/joshua-tree";
  const response = await request.get(path);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/json");
  expect(await response.json()).toEqual(row);

  const head = await request.head(path);
  expect(head.status()).toBe(200);
  expect(head.headers()["content-type"]).toBe("application/json");
  expect(await head.text()).toBe("");
});

test("site detail returns JSON 404 for unknown and wrong-case slugs", async ({ request }) => {
  for (const slug of ["not-a-catalog-site", "Joshua-Tree"]) {
    const path = `/api/sites/${slug}`;
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(response.headers()["content-type"]).toBe("application/json");
    expect(await response.json()).toEqual({ error: "Site not found." });

    const head = await request.head(path);
    expect(head.status()).toBe(404);
    expect(head.headers()["content-type"]).toBe("application/json");
    expect(await head.text()).toBe("");
  }
});

test("site detail summary matches the collection projection", async ({ request }) => {
  const collection = await request.get("/api/sites?view=summary");
  expect(collection.status()).toBe(200);
  const { sites }: { sites: Omit<Site, "description" | "notes">[] } = await collection.json();

  for (const slug of ["acadia", "joshua-tree"]) {
    const response = await request.get(`/api/sites/${slug}?view=summary`);
    expect(response.status()).toBe(200);
    const summary = await response.json();
    expect(summary).toEqual(sites.find((site) => site.slug === slug));
    expect(summary).not.toHaveProperty("description");
    expect(summary).not.toHaveProperty("notes");
  }

  const missing = await request.get("/api/sites/no-such-site?view=summary");
  expect(missing.status()).toBe(404);
  expect(await missing.json()).toEqual({ error: "Site not found." });
});

test("site detail rejects invalid and repeated views", async ({ request }) => {
  for (const [query, error] of [
    ["view=full", "view must be summary."],
    ["view=", "view must be summary."],
    ["view=summary&view=summary", "Use the view filter only once."],
  ]) {
    const response = await request.get(`/api/sites/acadia?${query}`);
    expect(response.status()).toBe(400);
    expect(response.headers()["content-type"]).toBe("application/json");
    expect(await response.json()).toEqual({ error });
  }
});

test("static site endpoints take precedence over the slug route", async ({ request }) => {
  for (const [segment, body] of [
    ["summary", { total: 6 }],
    ["exports", { catalog: "night-atlas", formats: expect.any(Array) }],
    [
      "status",
      { catalog: "night-atlas", site_count: 6, state_count: 5, generated_at: expect.any(String) },
    ],
  ] as const) {
    const response = await request.get(`/api/sites/${segment}`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject(body);
  }
});
