import type { Site } from "@/lib/catalog";

export function validateSiteView(params: URLSearchParams) {
  const views = params.getAll("view");
  if (views.length > 1) return "Use the view filter only once.";
  if (views.length === 1 && views[0] !== "summary") return "view must be summary.";
  return null;
}

export function toSiteSummary({ description, notes, ...site }: Site) {
  return site;
}
