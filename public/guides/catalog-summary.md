# Night Atlas catalog summary API

`GET /api/sites/summary` returns HTTP 200 with JSON counts, not individual site records. Without filters it summarizes the entire catalog. All three fields describe the same set of matching sites:

- `total`: the number of matching sites.
- `byState`: an object mapping state names to counts.
- `byRegion`: an object mapping region names to counts.

Groups with no matches are omitted, not returned with a count of zero.

## Filters

All filters are optional and may appear at most once. When combined, a site must satisfy **all** supplied filters.

| Parameter | Matching rule |
| --- | --- |
| `state` | Exact, case-sensitive state name, such as `Maine`. Empty, unknown, or differently cased values match no sites rather than returning an error. |
| `region` | Exactly `West`, `Southwest`, or `Northeast`. Values are case-sensitive; an empty or unsupported value returns HTTP 400. |
| `q` | Case-insensitive text search. Every whitespace-separated word must occur as a substring in the site's name, state, or viewpoint; different words can match different fields. Leading and trailing whitespace is trimmed. A blank search does not narrow the results, and a trimmed search longer than 80 characters returns HTTP 400. |

## Example requests

Use these paths on your Night Atlas origin:

- [Filter by region](/api/sites/summary?region=West): three sites, with `byRegion` equal to `{"West":3}`.
- [Search by text](/api/sites/summary?q=acadia): `{"total":1,"byState":{"Maine":1},"byRegion":{"Northeast":1}}`.
- [Combine all three filters](/api/sites/summary?state=Maine&region=Northeast&q=%20ACADIA%20sand%20beach%20): one match in Maine and the Northeast.
- [Search with no matches](/api/sites/summary?q=acadia&region=West): HTTP 200 with `{"total":0,"byState":{},"byRegion":{}}`.

## HTTP 400 errors

Validation errors return JSON with a machine-readable `code`, the offending `parameter`, and a human-readable `error` string. These responses include `Cache-Control: no-store`. Use `code` and `parameter` instead of parsing the message.

| Example request | `code` | `parameter` |
| --- | --- | --- |
| [Repeat a filter, even with the same value](/api/sites/summary?q=acadia&q=acadia) | `repeated_filter` | `q` |
| [Use a noncanonical region](/api/sites/summary?region=west) | `invalid_filter_value` | `region` |
| [Send an unsupported parameter alongside a valid filter](/api/sites/summary?q=acadia&limit=1) | `unknown_parameter` | `limit` |
| [Send an 81-character search](/api/sites/summary?q=012345678901234567890123456789012345678901234567890123456789012345678901234567890) | `invalid_filter_value` | `q` |

## Change history

- [Original summary endpoint](https://github.com/alanhoff/nextjs-demo/commit/9b26871e26af92050e0c051bc96f611a1b327988)
- [`byRegion` response field](https://github.com/alanhoff/nextjs-demo/commit/241a81ee0b90eb954ba773510a2943eac79c3e0b)
- [`region` filtering](https://github.com/alanhoff/nextjs-demo/commit/3220c9de98bb69773ab73799951b679494198599)
- [`q` text search](https://github.com/alanhoff/nextjs-demo/commit/28d500dd56dbd4154fbdb827f3a4b2f459a9d9fe)

## Client compatibility

| Version | `?state=Maine&state=Utah` | `?limit=1` |
| --- | --- | --- |
| [241a81e](https://github.com/alanhoff/nextjs-demo/blob/241a81ee0b90eb954ba773510a2943eac79c3e0b/app/api/sites/summary/route.ts) | HTTP 200; uses the first value (`Maine`) only. | HTTP 200; ignores `limit` and summarizes the full catalog. |
| [5642ccf](https://github.com/alanhoff/nextjs-demo/blob/5642ccfc864cdf936e39f70d0270e285710cbf1c/app/api/sites/summary/route.ts) | HTTP 400; `repeated_filter` for `state`. | HTTP 200; ignores `limit` and summarizes the full catalog. |
| [6551ef7](https://github.com/alanhoff/nextjs-demo/blob/6551ef78362c23fc735e84758c1a515a706721e4/app/api/sites/summary/route.ts) | HTTP 400; `repeated_filter` for `state`. | HTTP 400; `unknown_parameter` for `limit`. |
| Today | HTTP 400; `repeated_filter` for `state`. | HTTP 400; `unknown_parameter` for `limit`. |

- At `6551ef7`: “The limit parameter is not supported. Use state or region.”
- Today: “The limit parameter is not supported. Use state, region, or q.”

Branch on `code` and `parameter`, not the English `error` text.
