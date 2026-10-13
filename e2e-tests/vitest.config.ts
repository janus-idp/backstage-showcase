import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // E2E specs: playwright/e2e/**/*.spec.ts (Playwright). Unit tests: unit/**/*.test.ts.
    include: ["unit/**/*.test.ts"],
    // Runner regression tests spawn real shells, each bounded by its own 10 s limit.
    testTimeout: 30_000,
  },
});
