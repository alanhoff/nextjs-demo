import { setTimeout } from "node:timers/promises";
import { expect, test } from "@playwright/test";

const timestampShape = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

test("sites status reports the full catalog and generates a fresh UTC timestamp", async ({
  request,
}) => {
  const catalog = await request.get("/api/sites");
  expect(catalog.status()).toBe(200);
  const { sites } = await catalog.json();
  expect(sites).toHaveLength(6);

  async function readStatusTimestamp() {
    const startedAt = Date.now();
    const response = await request.get("/api/sites/status");
    const receivedAt = Date.now();
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^application\/json(?:;|$)/);
    expect(response.headers()["cache-control"]).toBe("no-store");
    const body = await response.json();
    expect(body).toEqual({
      catalog: "night-atlas",
      site_count: sites.length,
      generated_at: expect.stringMatching(timestampShape),
    });
    const timestamp = Date.parse(body.generated_at);
    expect(timestamp).toBeGreaterThanOrEqual(startedAt);
    expect(timestamp).toBeLessThanOrEqual(receivedAt);
    return timestamp;
  }

  const first = await readStatusTimestamp();
  await setTimeout(20);
  expect(await readStatusTimestamp()).toBeGreaterThan(first);
});
