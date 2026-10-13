# E2E Code Coverage for the RHDH Repository

Jira: [RHIDP-13243](https://issues.redhat.com/browse/RHIDP-13243)
Epic: [RHIDP-13242](https://issues.redhat.com/browse/RHIDP-13242)
Feature: [RHDHPLAN-851](https://issues.redhat.com/browse/RHDHPLAN-851)

## What this is

This document describes how the `e2e-tests/` Playwright suite collects JavaScript
coverage from Chromium while exercising a deployed RHDH instance, and how that
coverage flows to Codecov.

Scope of this mechanism:

- **What it measures**: frontend JS/TS in `packages/app/src/**` and related modules,
  exercised by the Playwright specs in `e2e-tests/playwright/e2e/`.
- **What it does not measure**: backend-only code, code not loaded by the browser
  during the E2E run, plugins delivered as separate OCI images (tracked under
  RHIDP-11866 via CoverPort).

## How it works

1. **Opt-in via env var.** When `COLLECT_COVERAGE=true`, a Playwright fixture
   (`e2e-tests/playwright/support/coverage/test.ts`) extends the base `test`
   and wraps each run with `page.coverage.startJSCoverage()` / `stopJSCoverage()`.
   Raw V8 coverage is persisted per test as JSON under `coverage/e2e-raw/`.
2. **Aggregation at run end.** A Playwright reporter
   (`e2e-tests/playwright/support/coverage/reporter.ts`) reads the raw files at
   `onEnd` and uses `monocart-coverage-reports` to convert V8 output to
   Istanbul format and emit a merged LCOV + HTML report under `coverage/e2e/`.
3. **Mapping to repository paths.** The deployed image serves `packages/app` as
   minified bundles with source maps whose sources read `webpack://app/./src/...`.
   `support/coverage/source-paths.ts` keeps only `packages/app/src/**` and names
   each file by its repository path; without it the report lists ~3,300 bundled
   `node_modules` files and none that Codecov can match to this repository.
4. **Codecov upload (CI).** `testing::_upload_e2e_coverage` in
   `.ci/pipelines/lib/testing.sh` uploads `coverage/e2e/lcov.info` with the flag
   `rhdh-e2e-frontend`, attributed to the PR head commit (see "CI wiring" below).

With `COLLECT_COVERAGE` unset (the default), the fixture and reporter are no-ops
and the E2E suite runs identically to the pre-coverage configuration.

## How to use it locally

### Prerequisites

- A deployed RHDH reachable via `BASE_URL`
- `yarn install` completed in `e2e-tests/`
- Node.js 24

### Run a spec with coverage enabled

```bash
cd e2e-tests
COLLECT_COVERAGE=true yarn playwright test playwright/e2e/smoke-test.spec.ts
```

Outputs:

- `e2e-tests/coverage/e2e-raw/` — one JSON file per test run (raw V8 coverage)
- `e2e-tests/coverage/e2e/` — merged report: `lcov.info`, `coverage-summary.json`,
  HTML dashboard at `index.html`

### View the HTML report

```bash
open e2e-tests/coverage/e2e/index.html
```

## Migrating a spec to capture coverage

There are two patterns depending on how the spec manages its browser page.

### Specs that use the built-in `{ page }` fixture (most specs)

Opt in by importing the extended `test`/`expect` from the coverage helper
instead of `@playwright/test`:

```ts
// Before
import { test, expect } from "@playwright/test";

// After — uses the @support path alias (configured in tsconfig.json),
// so the import is the same regardless of file depth:
import { test, expect } from "@support/coverage/test";
```

The rest of the spec stays identical — `describe`, `beforeAll`, `expect`,
locators, and fixtures behave exactly the same.

### Specs that create their own context/page via `browser.newContext()`

Several existing specs (for example `plugins/adoption-insights`,
`plugins/scorecard`) manage their own `BrowserContext` and `Page` in
`beforeAll` instead of using the default `{ page }` fixture. These specs
bypass the auto-instrumented fixture above — they need to call the helpers
explicitly:

```ts
import { test, expect, startCoverageForPage, stopCoverageForPage } from "@support/coverage/test";

test.describe("my feature", () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test("something", async ({}, testInfo) => {
    await startCoverageForPage(page);
    try {
      // test body ...
    } finally {
      await stopCoverageForPage(page, testInfo);
    }
  });
});
```

`startCoverageForPage` and `stopCoverageForPage` are safe to call
unconditionally — they are no-ops when `COLLECT_COVERAGE` is unset, and any
internal failure is logged rather than propagated so coverage collection
cannot fail a test.

### Specs that have not migrated

Run normally and simply do not contribute to coverage data. All specs that drive
the UI have migrated; new specs should import from `@support/coverage/test`.

## CI wiring

- `handle_ocp_pull` (`.ci/pipelines/jobs/ocp-pull.sh`) sets `COLLECT_COVERAGE=true`, so
  the `e2e-ocp-helm` PR check collects coverage for both the `showcase` and
  `showcase-rbac` projects. Each upload lands on the same commit and flag, and Codecov
  merges them.
- `CODECOV_TOKEN` is read from `/tmp/secrets/CODECOV_TOKEN`, the `rhdh` Vault bundle
  OpenShift CI mounts into the step. **The key must exist in that bundle**; the GitHub
  Actions secret of the same name does not reach Prow. Without it the upload is skipped
  and the report is still saved as the `coverage` artifact.
- Presubmits test a local merge of the PR onto its base branch, whose SHA GitHub has
  never seen. The upload is therefore attributed to the PR head (`PULL_PULL_SHA`, or
  `JOB_SPEC` for a Gangway re-run) with `--pr`, and skipped when neither is known.
- Coverage is reporting, not a gate: a failed collection, report or upload logs a
  warning and never changes the job result.
- Uploads go to PR head commits only. Codecov carries a flag forward from the commit
  it was uploaded to, and a squash merge creates a new commit on `main`, so the flag
  shows on PRs but not on `main`'s dashboard. Uploading from a `main` nightly would
  close that gap.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `COLLECT_COVERAGE` | (unset) | Set to `true` to enable coverage collection |
| `COVERAGE_OUTPUT_DIR` | `<cwd>/coverage/e2e-raw` | Where per-test raw V8 coverage is written |
| `COVERAGE_REPORT_DIR` | `<cwd>/coverage/e2e` | Where the merged Istanbul report is written |
| `COVERAGE_GENERATE_TIMEOUT_MS` | `120000` (2 min) | Maximum time the reporter will wait for `monocart.CoverageReport.generate()` before aborting. Prevents a CI job from hanging if coverage aggregation stalls |

Raw coverage file names include the spec title path, worker index, and retry
number (for example `Smoke_test_basic_flow-w0-r0-1714003200000.json`) so
parallel workers and retries never overwrite each other's output.

## Known limitations

- **Chromium only.** `page.coverage` is a CDP feature and is not available in
  Firefox or WebKit. Chromium is the default browser for this suite, so this
  is not a practical issue today.
- **Source maps required.** The mapping depends on the image shipping
  `packages/app/dist/static/*.js.map`, which the Backstage production build emits
  (`devtool: "source-map"`) and the Containerfile keeps. Verified against
  `quay.io/rhdh-community/rhdh:next`. If they disappear, the report is empty rather
  than wrong, because no source would match `packages/app/src/**`.
- **Frontend of this repository only.** `packages/app` is the only frontend package
  here; plugins load from their own bundles and are covered under RHIDP-11866.
- **Three specs do not contribute.** The `external-database/verify-tls-config-*`
  specs exercise database connectivity, not the UI, and do not import the fixture.

## Related coverage flags in Codecov

| Flag | Source | Scope |
|---|---|---|
| `rhdh` | Jest (`packages/*`, `plugins/*`) | Unit / integration |
| `rhdh-e2e-frontend` (new) | Playwright `page.coverage` | E2E frontend — this doc |
| `overlays-e2e-<plugin>` (future) | CoverPort Tekton | Upstream plugins via OCI (RHIDP-11866) |

## Approach B: instrumented showcase image (RHIDP-13244), no-go

Approach B would build a second `rhdh:<tag>-coverage` image with
`babel-plugin-istanbul` and read `window.__coverage__` after each test. Not pursued:

- Its gain over this approach is fidelity for `packages/app`, and with source maps
  in the image this approach already reports `packages/app/src` by repository path.
- `packages/app` is a thin shell (about 80 source files in the bundle); the code that
  carries RHDH's behaviour lives in plugins, which RHIDP-13411 instruments at build
  time for the overlay E2E runs (RHIDP-11866).
- It would add an image build to every PR and a second image to keep in step with
  the production one.

Revisit if branch coverage of `packages/app` becomes a requirement: V8 block coverage
reports branches less precisely than Istanbul instrumentation.

## References

- Playwright coverage API: https://playwright.dev/docs/api/class-coverage
- monocart-coverage-reports: https://github.com/cenfun/monocart-coverage-reports
- Chrome DevTools Protocol — Coverage domain
- RHDH Test Strategy Proposal (Google Doc): https://docs.google.com/document/d/1B-Jl1uwX3sdWOGqs9CN9rTFYH743q-o5YVMoAz_yPh8/edit
