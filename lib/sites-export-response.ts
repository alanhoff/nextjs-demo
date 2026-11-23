import { createHash } from "node:crypto";
import { matchesIfNoneMatch } from "./etag";

export function sitesExportResponse(
  request: Request,
  format: "csv" | "geojson" | "ndjson",
  body: string,
  headers: Record<string, string>,
) {
  const tag = `"${format}-${createHash("sha256").update(body).digest("hex")}"`;
  const etag = `W/${tag}`;
  if (matchesIfNoneMatch(request.headers.get("If-None-Match"), tag)) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }
  return new Response(body, { headers: { ...headers, ETag: etag } });
}
