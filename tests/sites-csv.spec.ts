import { expect, test } from "@playwright/test";

test("sites CSV downloads the complete catalog in order", async ({ request }) => {
  const response = await request.get("/api/sites.csv");
  expect(response.status()).toBe(200);

  const headers = response.headersArray();
  expect(
    headers.filter(({ name }) => name.toLowerCase() === "content-type").map(({ value }) => value),
  ).toEqual(["text/csv; charset=utf-8"]);
  expect(
    headers
      .filter(({ name }) => name.toLowerCase() === "content-disposition")
      .map(({ value }) => value),
  ).toEqual(['attachment; filename="sites.csv"']);

  const expected = [
    "code,slug,name",
    "JOTR,joshua-tree,Joshua Tree",
    "BIBE,big-bend,Big Bend",
    "BRCA,bryce-canyon,Bryce Canyon",
    "GRBA,great-basin,Great Basin",
    "DEVA,death-valley,Death Valley",
    "ACAD,acadia,Acadia",
    "",
  ].join("\r\n");
  expect(await response.body()).toEqual(Buffer.from(expected, "utf8"));
});
