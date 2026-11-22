# Sites summary route conventions

- Compute `total`, `byState`, and `byRegion` from the same filtered site slice.
- Return query validation failures as HTTP 400 JSON with `code`, `parameter`, and meaningful `error` text. Set `Cache-Control: no-store`.
- Accept only the `state`, `region`, and `q` query parameter names.
- Trim outer whitespace from `q` and reject trimmed values longer than 80 characters with `invalid_filter_value`. An empty trimmed search adds no restriction. Reuse the catalog matcher for case-insensitive, multi-word matching across name, state, and viewpoint, combined with any `state` and `region` filters.
- Use `unknown_parameter` and report the offending name for any unsupported parameter, even alongside a valid filter.
- Use `repeated_filter` when a singleton filter appears more than once, even if the values are identical or empty. Use `invalid_filter_value` for unsupported values of enumerated filters.
- `state` uses exact, case-sensitive matching with no enumerated-value validation. Empty and unknown values match no sites. `region` must exactly match a canonical catalog region and can be used alone or together with `state`.
