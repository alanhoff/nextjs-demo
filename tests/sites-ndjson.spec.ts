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

  const attachment = 'attachment; filename="night-atlas-sites.ndjson"';
  const nonmatching = '"ndjson-stale"';
  for (const query of ["", "?download=0", "?download=1"]) {
    const path = `/api/sites.ndjson${query}`;
    const disposition = query === "?download=1" ? attachment : undefined;

    await test.step(`Check representation and revalidation for ${path}`, async () => {
      const fresh = query ? await request.get(path) : response;
      expect(fresh.status()).toBe(200);
      expect(fresh.headers()["content-disposition"]).toBe(disposition);
      expect(fresh.headers()["content-type"]).toBe("application/x-ndjson");
      expect(fresh.headers().etag).toBe(etag);
      expect(await fresh.body()).toEqual(bytes);

      for (const validator of [etag, etag.slice(2), `${nonmatching}, ${etag}`, "*"]) {
        const cached = await request.get(path, {
          headers: { "If-None-Match": validator },
        });
        expect(cached.status(), `If-None-Match: ${validator}`).toBe(304);
        expect(cached.headers().etag).toBe(etag);
        expect(await cached.body()).toHaveLength(0);
      }

      const stale = await request.get(path, {
        headers: { "If-None-Match": nonmatching },
      });
      expect(stale.status()).toBe(200);
      expect(stale.headers()["content-disposition"]).toBe(disposition);
      expect(stale.headers()["content-type"]).toBe("application/x-ndjson");
      expect(stale.headers().etag).toBe(etag);
      expect(await stale.body()).toEqual(bytes);
    });
  }
});

test("NDJSON filters by exact state without changing serialization or download caching", async ({ request }) => {
  const full = await request.get("/api/sites.ndjson");
  const lines = (await full.text()).trimEnd().split("\n");

  for (const [state, download] of [
    ["Maine", "0"],
    ["California", "1"],
  ]) {
    const path = `/api/sites.ndjson?state=${state}&download=${download}&region=Atlantis`;
    const matching = lines.filter((line) => JSON.parse(line).state === state);
    expect(matching.length).toBeGreaterThan(0);
    const expected = `${matching.join("\n")}\n`;
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("application/x-ndjson");
    expect(response.headers()["content-disposition"]).toBe(
      download === "1" ? 'attachment; filename="night-atlas-sites.ndjson"' : undefined,
    );
    expect(await response.text()).toBe(expected);

    const etag = `W/"ndjson-${createHash("sha256").update(expected).digest("hex")}"`;
    expect(response.headers().etag).toBe(etag);
    const cached = await request.get(path, { headers: { "If-None-Match": etag } });
    expect(cached.status()).toBe(304);
    expect(cached.headers().etag).toBe(etag);
    expect(await cached.body()).toHaveLength(0);
  }

  for (const state of ["", "Atlantis", "maine"]) {
    const response = await request.get(`/api/sites.ndjson?state=${state}`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("application/x-ndjson");
    expect(await response.body()).toHaveLength(0);
  }

  for (const second of ["Maine", "California"]) {
    const response = await request.get(`/api/sites.ndjson?state=Maine&state=${second}`);
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: "Use the state filter only once." });
  }
});
