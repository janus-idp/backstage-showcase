import { defineConfig } from "cypress";

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
    baseUrl: "https://PLACE_HOLDER",
    specPattern: "cypress/e2e/**/*.spec.ts",
  },
});
