import { readFile, readdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const sourceBase = "https://github.com/alanhoff/nextjs-demo/blob/HEAD/app/";
const handlerDeclaration =
  /^export\s+(?:(?:async\s+)?function\s+(GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS)\s*\(|const\s+(GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS)\s*=)/gm;

async function routeRows(directory = "app", prefix = ""): Promise<string[]> {
  const rows: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      rows.push(...(await routeRows(`${directory}/${entry.name}`, `${prefix}${entry.name}/`)));
    } else if (entry.name === "route.ts") {
      const source = await readFile(`${directory}/route.ts`, "utf8");
      const methods = Array.from(source.matchAll(handlerDeclaration), (match) => match[1] ?? match[2]);
      expect(methods.length, `${directory}/route.ts handler exports`).toBeGreaterThan(0);
      const url = `/${prefix.slice(0, -1).replace(/\[([^\]]+)\]/g, "{$1}")}`;
      const link = `${sourceBase}${prefix.split("/").map(encodeURIComponent).join("/")}route.ts`;
      rows.push(`| \`${url}\` | ${methods.map((method) => `\`${method}\``).join(", ")} | [route.ts](${link}) |`);
    }
  }
  return rows;
}

test("serves the route methods guide with the checked-in handler inventory", async ({ request }) => {
  const response = await request.get("/guides/route-methods.md");
  expect(response.status()).toBe(200);

  const guide = await response.text();
  expect(guide).toMatch(/^# Route methods\r?\n/);
  expect(guide).toContain("HEAD = GET");
  expect(guide).toContain("308 Permanent Redirect");
  expect(guide).toContain("lunar-phases-{date}.ics");
  expect(guide).toContain("## Implicit methods");

  const rows = guide.split(/\r?\n/).filter((line) => line.startsWith("|"));
  expect(rows.slice(2).sort()).toEqual((await routeRows()).sort());
});
