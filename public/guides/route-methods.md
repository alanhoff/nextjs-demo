# Route methods

This guide lists the HTTP methods explicitly exported by Night Atlas’s `app/**/route.ts` modules. It does not inventory page routes or replace the [catalog OpenAPI document](/openapi.json).

| Public URL pattern | Explicit method exports | Source |
| --- | --- | --- |
| `/api/nearby` | `GET` | [route.ts](https://github.com/alanhoff/nextjs-demo/blob/HEAD/app/api/nearby/route.ts) |
| `/api/sites` | `GET`, `HEAD` | [route.ts](https://github.com/alanhoff/nextjs-demo/blob/HEAD/app/api/sites/route.ts) |
| `/api/sites/{slug}` | `GET` | [route.ts](https://github.com/alanhoff/nextjs-demo/blob/HEAD/app/api/sites/%5Bslug%5D/route.ts) |
| `/api/sites/exports` | `GET` | [route.ts](https://github.com/alanhoff/nextjs-demo/blob/HEAD/app/api/sites/exports/route.ts) |
| `/api/sites/status` | `GET` | [route.ts](https://github.com/alanhoff/nextjs-demo/blob/HEAD/app/api/sites/status/route.ts) |
| `/api/sites/summary` | `GET` | [route.ts](https://github.com/alanhoff/nextjs-demo/blob/HEAD/app/api/sites/summary/route.ts) |
| `/api/sites.csv` | `GET` | [route.ts](https://github.com/alanhoff/nextjs-demo/blob/HEAD/app/api/sites.csv/route.ts) |
| `/api/sites.geojson` | `GET` | [route.ts](https://github.com/alanhoff/nextjs-demo/blob/HEAD/app/api/sites.geojson/route.ts) |
| `/api/sites.ndjson` | `GET` | [route.ts](https://github.com/alanhoff/nextjs-demo/blob/HEAD/app/api/sites.ndjson/route.ts) |
| `/guides/catalog-formats.md` | `GET` | [route.ts](https://github.com/alanhoff/nextjs-demo/blob/HEAD/app/guides/catalog-formats.md/route.ts) |
| `/parks/{code}` | `GET`, `HEAD` | [route.ts](https://github.com/alanhoff/nextjs-demo/blob/HEAD/app/parks/%5Bcode%5D/route.ts) |
| `/sky-notes/calendar.ics` | `GET` | [route.ts](https://github.com/alanhoff/nextjs-demo/blob/HEAD/app/sky-notes/calendar.ics/route.ts) |

All listed methods are named function exports (synchronous or asynchronous), except for the park route’s explicit `export const HEAD = GET` alias. `/api/sites` exports a separate named `HEAD` function.

## Implicit methods

Next.js supplies `HEAD` from `GET` when a module exports `GET` but not `HEAD`. When `OPTIONS` is not exported, Next.js supplies it and sets the `Allow` header. These framework-provided methods are not source exports and are not listed in the table.

## Outside the catalog OpenAPI document

- **Park-code redirect:** `GET /parks/{code}` and its `HEAD` alias return `308 Permanent Redirect` to `/sites/{slug}` for a known, case-sensitive park code (for example, `/parks/BIBE` redirects to `/sites/big-bend`). Unknown codes return `404`. This is separate from the `/go/` redirect handled by Proxy.
- **Calendar download:** `GET /sky-notes/calendar.ics?date=2027-01-01` downloads the next four lunar phases as a `text/calendar` attachment named `lunar-phases-{date}.ics`. Supply exactly one valid `date` in `YYYY-MM-DD` format from 1700 through 2099. Missing, repeated, or invalid dates return `400`; if four phases are unavailable, the route returns `503`.
