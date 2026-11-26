# Verify your changes locally

This guide is for a first-time contributor who has cloned Night Atlas and wants to check their work on their own machine before pushing. Each step gives a command and the result you should see. If a result differs, stop and fix that step before moving on.

The checks below match the hosted [CI workflow](../.github/workflows/check.yml): lint, type-check, and the Playwright test suite. CI also builds the Docker image and runs the tests against it; that part is optional locally and is described at the end.

## Before you start

- **Node.js 26.13.x.** The exact version is in [.node-version](../.node-version). `package.json` also accepts `^26.13.0`. Install it with your preferred version manager, or use the [official download](https://nodejs.org/).
- **npm**, which ships with Node.
- **Docker with the Compose plugin** is optional. You need it only for the Docker steps at the end.

## Checklist

Run these commands from the root of the repository.

1. **Confirm your Node version.**

   ```sh
   node --version
   ```

   Expected: `v26.13.1` (or another `v26.13.x`). If you see a different major version, install Node 26.13 before continuing.

2. **Install the locked dependencies.**

   ```sh
   npm ci
   ```

   Expected: npm finishes successfully without an error. The package count in npm's summary can vary. `npm ci` installs exactly the versions in `package-lock.json`, and it creates a `node_modules/` folder.

3. **Run the linter.**

   ```sh
   npm run lint
   ```

   Expected: Biome completes with no errors or warnings and the command exits with status 0. This runs `biome lint --error-on-warnings .`, so any warning also fails the check.

4. **Run the type checker.**

   ```sh
   npm run typecheck
   ```

   Expected: the command finishes with no output from `tsc` and exits with status 0. It first runs `next typegen` to generate Next.js types, then `tsc --noEmit`.

5. **Install the Chromium browser for the tests.**

   ```sh
   npx playwright install chromium
   ```

   Expected: Playwright downloads Chromium and ends with a line that mentions `chromium` and the install location. On a bare Linux machine, the browser may also need system libraries. In that case run `npx playwright install --with-deps chromium` instead. CI uses this form.

6. **Run one representative test.** This runs only the status endpoint test, which is a quick check that the local setup works end to end.

   ```sh
   npx playwright test tests/sites-status.spec.ts
   ```

   Expected: Playwright starts a development server on `127.0.0.1:3100`, runs the test, and ends with a summary line of `1 passed`. The command exits with status 0. The test requests `/api/sites/status` and checks the catalog counts, the `no-store` cache header, and a `generated_at` timestamp.

7. **Run the full test suite (optional).** This runs every test in `tests/`, including filter history, cookies, photo navigation, park-code redirects, and invalid requests.

   ```sh
   npm test
   ```

   Expected: Playwright ends with a summary line such as `N passed` and no `failed` count, and the command exits with status 0. Playwright uses the same development server on port 3100 as in step 6. This run takes longer than the single test in step 6.

If every step matched its expected result, your local setup is ready. Before you open a pull request, repeat steps 3 to 7 on your final changes.

## Use the Docker image (optional)

Use this path if you want to test the same image that CI builds. You need Docker with the Compose plugin.

1. **Start the app in Docker.**

   ```sh
   docker compose up --build --wait
   ```

   Expected: the image builds and the command ends after the health check passes. The app is published only on `127.0.0.1:3000`. If port 3000 is busy, run `PORT=3101 docker compose up --build --wait` and use port 3101 in the next step.

2. **Run the tests against the running container.**

   ```sh
   PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm test
   ```

   Expected: the same `N passed` summary as step 7. Playwright does not start its own server in this mode.

3. **Stop the container.**

   ```sh
   docker compose down
   ```

   Expected: the container is removed and the command exits with status 0.

## How this relates to hosted CI

Locally, you run the steps above on your own machine. Hosted CI runs the same lint, type-check, and test steps on every push to `main` and on every pull request. It also builds the Docker image, waits for its health check, and runs the tests against that image. The workflow fails if any of these steps fails. Local runs are a fast way to catch problems first; the hosted checks are still required before a change can be merged.

---

## Automated verification

Every push to `main` and every pull request runs the **Check** workflow in [.github/workflows/check.yml](../.github/workflows/check.yml). It is a single `verify` job on `ubuntu-latest` with a 15-minute timeout, and it has read-only repository permissions. The job runs these steps in order:

1. Checks out the repository and installs the Node version named in [.node-version](../.node-version), with the npm cache enabled.
2. `npm ci` installs exactly the versions recorded in `package-lock.json`.
3. `npm run lint` runs Biome with `--error-on-warnings`.
4. `npm run typecheck` runs `next typegen` and then `tsc --noEmit`.
5. `npx playwright install --with-deps chromium` installs the browser and its system libraries.
6. `docker compose up --build --wait` builds the image and waits for its health check on port 3000.
7. `npm test` runs the Playwright suite with `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000`, so the tests exercise the running Docker image rather than a development server.
8. On failure, `docker compose logs` prints the container logs. Finally, `docker compose down` always runs.

When a step fails, the remaining steps are skipped unless they are the failure-only log step or the always-run teardown step.

### Parity with local commands

The local commands in [README.md](../README.md#verify-a-change) match the CI steps, with one deliberate difference in step 7:

| CI step | Local command |
| --- | --- |
| `npm ci` | `npm ci` |
| `npm run lint` | `npm run lint` |
| `npm run typecheck` | `npm run typecheck` |
| `npx playwright install --with-deps chromium` | `npx playwright install chromium` (add `--with-deps` on a bare Linux machine) |
| `docker compose up --build --wait` and `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm test` | Same two commands, to match CI exactly |
| `npm test` (no Docker) | `npm test`, which starts `npm run dev -- --hostname 127.0.0.1 --port 3100` through [playwright.config.ts](../playwright.config.ts) |

Without `PLAYWRIGHT_BASE_URL`, the Playwright configuration starts a development server on port 3100 and reuses an existing server outside CI. CI sets `CI`, which disables reuse and rejects `test.only`. Running the suite against Docker locally therefore gives the closest match to the hosted run.

### What the tests cover

The suite lives in `tests/`. According to the [README](../README.md#verify-a-change), it covers filter history, cookie isolation, photo navigation, park-code redirects, invalid requests, and a moon lookup across New Year's Eve. The status endpoint is covered by one of these files. [app/api/sites/status/route.ts](../app/api/sites/status/route.ts) returns `catalog`, `site_count`, `state_count`, `region_count`, and a fresh `generated_at` timestamp with `Cache-Control: no-store`. [tests/sites-status.spec.ts](../tests/sites-status.spec.ts) checks those fields against the catalog in [lib/catalog.ts](../lib/catalog.ts): six sites, five distinct states, and three regions (West, Southwest, Northeast). It also checks that `generated_at` advances between two requests.

The status test's expected counts are fixed at six sites, five states, and three regions, so adding or removing a site in `lib/catalog.ts` requires updating that test as well.

### Running one representative check

To run a single check locally, install the lockfile dependencies and run lint:

```sh
npm ci
npm run lint
```

For the status endpoint specifically, run `npx playwright test tests/sites-status.spec.ts` after `npm ci` and `npx playwright install chromium`. Lint and typecheck run in seconds and need no browser or Docker, so they are the fastest parity check. The full suite is the complete parity check and requires Docker.
