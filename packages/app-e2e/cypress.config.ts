import { defineConfig } from 'cypress';

module.exports = defineConfig({
  fixturesFolder: false,
  retries: 3,
  video: false,
  e2e: {
    setupNodeEvents() {},
    baseUrl: 'http://localhost:3000',
  },
});
