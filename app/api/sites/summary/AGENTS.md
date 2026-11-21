# Sites summary route conventions

- Compute `total`, `byState`, and `byRegion` from the same filtered site slice.
- Return query validation failures as HTTP 400 JSON with `code`, `parameter`, and meaningful `error` text. Set `Cache-Control: no-store`.
- Use `repeated_filter` when a singleton filter appears more than once, even if the values are identical or empty. Use `invalid_filter_value` for unsupported values of enumerated filters.
- `state` uses exact, case-sensitive matching with no enumerated-value validation. Empty and unknown values match no sites. `region` is not a query filter.
