import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";

test("NDJSON exports full canonical sites in order with an LF after each record", async ({ request }) => {
  const catalog = await request.get("/api/sites");
  expect(catalog.status()).toBe(200);
  const { sites } = await catalog.json();

  const response = await request.get("/api/sites.ndjson");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/x-ndjson");

  const bytes = await response.body();
  const body = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  const lines = body.split("\n");
  expect(lines.pop()).toBe("");
  expect(lines.map((line) => JSON.parse(line))).toEqual(sites);
  expect(lines).toEqual(sites.map((site: unknown) => JSON.stringify(site)));

  const etag = response.headers().etag;
  const digest = createHash("sha256").update(bytes).digest("hex");
  expect(etag).toBe(`W/"ndjson-${digest}"`);

  const nonmatching = '"ndjson-stale"';
  for (const validator of [etag, etag.slice(2), `${nonmatching}, ${etag}`, "*"]) {
    const cached = await request.get("/api/sites.ndjson", {
      headers: { "If-None-Match": validator },
    });
    expect(cached.status(), `If-None-Match: ${validator}`).toBe(304);
    expect(cached.headers().etag).toBe(etag);
    expect(await cached.body()).toHaveLength(0);
  }

  const fresh = await request.get("/api/sites.ndjson", {
    headers: { "If-None-Match": nonmatching },
  });
  expect(fresh.status()).toBe(200);
  expect(fresh.headers().etag).toBe(etag);
  expect(fresh.headers()["content-type"]).toBe("application/x-ndjson");
  expect(await fresh.body()).toEqual(bytes);
});
