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

for (const { query, rows } of [
  {
    query: "West",
    rows: [
      "JOTR,joshua-tree,Joshua Tree",
      "GRBA,great-basin,Great Basin",
      "DEVA,death-valley,Death Valley",
    ],
  },
  {
    query: "%20sOuThWeSt%20",
    rows: ["BIBE,big-bend,Big Bend", "BRCA,bryce-canyon,Bryce Canyon"],
  },
  { query: "Atlantis", rows: [] },
]) {
  test(`sites CSV filters by region ${query}`, async ({ request }) => {
    const response = await request.get(`/api/sites.csv?region=${query}`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("text/csv; charset=utf-8");
    expect(response.headers()["content-disposition"]).toBe('attachment; filename="sites.csv"');
    expect(await response.text()).toBe(["code,slug,name", ...rows, ""].join("\r\n"));
  });
}
