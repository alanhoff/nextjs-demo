# Catalog HTTP guide

Set `BASE_URL` to your Night Atlas origin (no trailing slash).

## Follow the next page

```sh
page="$BASE_URL/api/sites?state=California&limit=1"
curl -i "$page"
# Follow the URL inside <...> in the Link header:
curl -i "$BASE_URL/api/sites?state=California&offset=1&limit=1"
```

The first response has one entry in `sites`, but `X-Total-Count: 2` counts all
matches before pagination. It also sends:

```http
Link: </api/sites?state=California&offset=1&limit=1>; rel="next"
```

Resolve that target against the same origin and keep the same `Accept` header
(if set). The second page has one entry and the same total, but no `Link`:
stop when there is no next page.

## Select a format and inspect headers

JSON (`application/json`) is the default. Send `Accept: text/csv` for CSV
(`text/csv; charset=utf-8`). `Vary` includes `Accept`, and JSON and CSV have
distinct weak ETags (`W/"…"`). For the same URL and `Accept` value, GET and
HEAD share the representation and pagination headers (`Content-Type`, `Vary`,
`ETag`, `X-Total-Count`, and `Link` when present). HEAD has no body.

```sh
curl -I "$page"
curl -I -H 'Accept: text/csv' "$page"
```

## Revalidate the same representation

Run these commands from a writable directory. The first GET saves the CSV body
and its ETag separately and prints the HTTP status (`200`). The second GET
reads that same tag file and sends the validator unchanged in `If-None-Match`.
It prints the response headers, including the status line, and any body without
overwriting the saved CSV.

```sh
page="$BASE_URL/api/sites?state=California&limit=1"
curl -sS -H 'Accept: text/csv' --etag-save catalog-page.etag \
  -o catalog-page.csv -w 'HTTP %{http_code}\n' "$page"
curl -i -H 'Accept: text/csv' --etag-compare catalog-page.etag "$page"
```

If the validator still matches, the conditional GET returns `304 Not Modified`
with no body; reuse your stored CSV. Sending the JSON ETag instead with
`Accept: text/csv` returns `200 OK` with the CSV body and its ETag, because the
JSON validator does not match the selected CSV representation.
