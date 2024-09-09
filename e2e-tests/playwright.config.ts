import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: 80000,
  testDir: './playwright',
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 3,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['list'],
    ['junit', { outputFile: 'junit-results.xml' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: process.env.BASE_URL,
    ignoreHTTPSErrors: true,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: {
      mode: 'on',
      size: { width: 1920, height: 1080 },
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'showcase',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      testIgnore: [
        '**/playwright/e2e/plugins/rbac/**/*.spec.ts',
        '**/playwright/e2e/plugins/analytics/analytics-disabled-rbac.spec.ts',
        '**/playwright/e2e/verify-tls-config-with-external-postgres-db.spec.ts',
      ],
    },
    {
      name: 'showcase-rbac',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      testMatch: [
        '**/playwright/e2e/plugins/rbac/**/*.spec.ts',
        '**/playwright/e2e/plugins/analytics/analytics-disabled-rbac.spec.ts',
        '**/playwright/e2e/verify-tls-config-with-external-postgres-db.spec.ts',
      ],
    },
    {
      name: 'showcase-aks',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      testIgnore: [
        '**/playwright/e2e/plugins/rbac/**/*.spec.ts',
        '**/playwright/e2e/plugins/analytics/analytics-disabled-rbac.spec.ts',
        '**/playwright/e2e/verify-tls-config-with-external-postgres-db.spec.ts',
        '**/playwright/e2e/plugins/tekton/tekton.spec.ts',
        '**/playwright/e2e/catalog-timestamp.spec.ts',
        '**/playwright/e2e/plugins/quay/quay.spec.ts',
        '**/playwright/e2e/catalog-scaffoldedfromLink.spec.ts',
        '**/playwright/e2e/plugins/ocm.spec.ts',
        '**/playwright/e2e/github-happy-path.spec.ts',
      ],
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    //
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
