# Examples for e2e tests

At this point in time, the framework mixes a few tests with [Fixtures](https://playwright.dev/docs/test-fixtures) and some others with [`beforeEach/All` and `afterEach/All`](https://playwright.dev/docs/api/class-test).
Some contraints in the current architecture do not facilitate the use of Fixture, but it is prefered as it is considered a good practice.

You can see an examples of fixture usage at [github discovery test](../../e2e-tests/playwright/e2e/github-discovery.spec.ts).

An example on the before/after approach is the [github happy path](../../e2e-tests/playwright/e2e/github-happy-path.spec.ts), but almoust any test that you will fins at e2e will follow this approach.
