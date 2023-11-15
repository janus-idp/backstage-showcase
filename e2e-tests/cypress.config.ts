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
  e2e: {
    testIsolation: false,
    defaultCommandTimeout: 10000,
    baseUrl:
      'https://rhdb-developer-hub-skhileri-rhdh-v02.backstage-qe-eu-de-2-bx2-c74b3ed44ce86949f501aefb2db80652-0000.eu-de.containers.appdomain.cloud/',
    specPattern: 'cypress/e2e/**/*.spec.ts',

    setupNodeEvents(on, config) {
      const defaultValues: { [key: string]: string | boolean } = {
        GH_USER_ID: 'rhdh-qe',
        GH_USER_PASS: '',
        GH_2FA_SECRET: '',
        GH_RHDH_QE_USER_TOKEN: '',
        KEYCLOAK_URL: '',
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
