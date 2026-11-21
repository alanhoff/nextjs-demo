export const sitesCsvContentType = "text/csv; charset=utf-8";

function csvField(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function formatSitesCsv(sites: readonly { code: string; slug: string; name: string }[]) {
  const rows = sites.map(({ code, slug, name }) => [code, slug, name].map(csvField).join(","));
  return ["code,slug,name", ...rows, ""].join("\r\n");
}
