# Automated verification

The repository's automated checks run from one workflow, [`.github/workflows/check.yml`](../.github/workflows/check.yml), named **Check**. Its job is `verify`, which runs on `ubuntu-latest` with a 15-minute timeout.

## Triggers

- **`push` to `main`**: runs the full job against the commit that landed on `main`.
- **`pull_request`**: runs the full job for every pull request, for any target branch. The workflow has no path filters, so documentation-only changes run it too.

There is no scheduled run, no manual `workflow_dispatch`, and no separate release gate. The workflow requests only `contents: read`.

## Steps and local parity

The job runs these steps in order. Each row names the local command that reproduces it.

| CI step | Local equivalent | What it covers |
| --- | --- | --- |
| `actions/setup-node` with `node-version-file: .node-version` and `cache: npm` | Use the Node version in [`.node-version`](../.node-version) (`package.json` allows `^24.11.0` or `^26.13.0`). | Same runtime line as CI. |
| `npm ci` | `npm ci` | Installs exactly what `package-lock.json` pins. |
| `npm run lint` | `npm run lint` | Runs `biome lint --error-on-warnings .` over the whole tree. Biome _infos_ are printed but do not fail the step; warnings and errors do. |
| `npm run typecheck` | `npm run typecheck` | Runs `next typegen` to generate route types, then `tsc --noEmit`. |
| `npx playwright install --with-deps chromium` | `npx playwright install chromium` (add `--with-deps` on a bare Linux machine) | Installs the browser used by the Playwright tests. |
| `docker compose up --build --wait` | `docker compose up --build --wait` | Builds the production image from the [Dockerfile](../Dockerfile) and waits for its health check on port 3000. |
| `npm test` with `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000` | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm test` | Runs the Playwright suite in [`tests/`](../tests) against the running container. |
| `docker compose logs` on failure; `docker compose down` always | Same commands | Collects logs and stops the container. |

Two differences are worth knowing:

- **Which server the tests hit.** CI always points Playwright at the Docker image on port 3000. Plain `npm test` without `PLAYWRIGHT_BASE_URL` instead starts `npm run dev` on `127.0.0.1:3100` (see [`playwright.config.ts`](../playwright.config.ts)). Running against the container is the closest match to CI.
- **Lint scope.** The lint step does not check formatting. `npm run format` rewrites files with Biome, but nothing in CI verifies that formatting is clean.

## What the tests exercise

The [`tests/`](../tests) directory holds the browser and HTTP specs. The README's [Verify a change](../README.md#verify-a-change) section describes the same suite. One of them, [`tests/sites-status.spec.ts`](../tests/sites-status.spec.ts), checks the `GET /api/sites/status` route in [`app/api/sites/status/route.ts`](../app/api/sites/status/route.ts). It asserts:

- The route returns `200`, a JSON content type, and `Cache-Control: no-store`.
- `site_count`, `state_count`, and `region_count` match what `GET /api/sites` returns. The expected values come from the catalog in [`lib/catalog.ts`](../lib/catalog.ts): six sites, five distinct states, and three regions (West, Southwest, Northeast).
- `generated_at` is an ISO-8601 UTC timestamp that falls between the request's start and end, and a second request later returns a strictly greater timestamp.

Because the route calls `connection()`, the response is rendered per request. The spec therefore checks freshness rather than a fixed value.

## Demonstrating a single check locally

To run only the status spec against a local dev server:

```sh
npm ci
npx playwright test tests/sites-status.spec.ts
```

Playwright starts `npm run dev` on port 3100, runs the one test, and stops the server. The output looks like this on a passing run:

```text
Running 1 test using 1 worker

  ✓  1 tests/sites-status.spec.ts:6:1 › sites status reports the full catalog, distinct state and region counts, and generates a fresh UTC timestamp (1.1s)

  1 passed (6.0s)
```

The CI job does not run `npm run build` directly. The production build happens inside the Docker image (`RUN --network=none npm run build` in the [Dockerfile](../Dockerfile)), so a build failure appears in the `docker compose up --build --wait` step. The container's health check requests `/api/sites`, so `--wait` also gates the tests on that route responding.
