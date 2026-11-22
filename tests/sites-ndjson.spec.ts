import { expect, test } from "@playwright/test";

test("NDJSON exports full canonical sites in order with an LF after each record", async ({ request }) => {
  const catalog = await request.get("/api/sites");
  expect(catalog.status()).toBe(200);
  const { sites } = await catalog.json();

  const response = await request.get("/api/sites.ndjson");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/x-ndjson");

  const body = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(await response.body());
  const lines = body.split("\n");
  expect(lines.pop()).toBe("");
  expect(lines.map((line) => JSON.parse(line))).toEqual(sites);
  expect(lines).toEqual(sites.map((site: unknown) => JSON.stringify(site)));
});
