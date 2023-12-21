import { defineConfig } from 'cypress';
import installLogsPrinter from 'cypress-terminal-report/src/installLogsPrinter';

export default defineConfig({
  defaultCommandTimeout: 40000,
  execTimeout: 150000,
  pageLoadTimeout: 90000,
  requestTimeout: 15000,
  responseTimeout: 15000,
  animationDistanceThreshold: 20,
  chromeWebSecurity: false,
  viewportWidth: 1920,
  viewportHeight: 1080,
  video: true,
  videoUploadOnPasses: true,
  screenshotOnRunFailure: true,
  reporter: 'junit',
  reporterOptions: {
    mochaFile: 'e2e-tests/cypress/results/junit/junit-[hash].xml',
  },
  e2e: {
    testIsolation: false,
    defaultCommandTimeout: 10000,
    baseUrl: 'https://PLACE_HOLDER',
    specPattern: 'cypress/e2e/**/*.spec.ts',

    setupNodeEvents(on, config) {
      const defaultValues: { [key: string]: string | boolean } = {
        GH_USER_ID: 'rhdh-qe',
        GH_USER_PASS: '',
        GH_2FA_SECRET: '',
        GH_RHDH_QE_USER_TOKEN: '',
        KEYCLOAK_BASE_URL: '',
        KEYCLOAK_REALM: '',
        KEYCLOAK_CLIENT_ID: '',
        KEYCLOAK_CLIENT_SECRET: '',
      };

      for (const key in defaultValues) {
        if (!config.env[key]) {
          config.env[key] = defaultValues[key];
        }
      }

      installLogsPrinter(on, {
        printLogsToConsole: 'always',
      });
      return config;
    },
  },
});
