import { expect, test } from "@playwright/test";

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
