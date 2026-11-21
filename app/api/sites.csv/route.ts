import { getSites } from "@/lib/catalog";

function csvField(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export async function GET() {
  const sites = await getSites();
  const rows = sites.map(({ code, slug, name }) => [code, slug, name].map(csvField).join(","));
  const csv = ["code,slug,name", ...rows, ""].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sites.csv"',
    },
  });
}
