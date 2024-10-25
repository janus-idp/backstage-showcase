import { test, Page, TestInfo, expect } from "@playwright/test";
import { Common, setupBrowser } from "../utils/Common";
import { ThemeVerifier } from "../utils/custom-theme/theme-verifier";
import {
  customTabIcon,
  customBrandIcon,
} from "../support/testData/custom-theme";

let page: Page;

test.describe("CustomTheme should be applied", () => {
  let common: Common;
  let themeVerifier: ThemeVerifier;

  test.beforeAll(async ({ browser }, testInfo) => {
    page = (await setupBrowser(browser, testInfo)).page;
    common = new Common(page);
    themeVerifier = new ThemeVerifier(page);

    await common.loginAsGuest();
  });

  // eslint-disable-next-line no-empty-pattern
  test("Verify that theme light colors are applied using static red hat developer theme plugin and make screenshots", async ({}, testInfo: TestInfo) => {
    await themeVerifier.setTheme("Light");
    await themeVerifier.verifyHeaderGradient(
      "none, linear-gradient(90deg, rgb(216, 98, 208), rgb(216, 164, 98))",
    );
    await themeVerifier.verifyBorderLeftColor("rgb(98, 216, 105)");
    await themeVerifier.takeScreenshotAndAttach(
      "screenshots/custom-theme-light-inspection.png",
      testInfo,
      "custom-theme-light-inspection",
    );
    await themeVerifier.verifyPrimaryColors("#2A61A7");
  });

  // eslint-disable-next-line no-empty-pattern
  test("Verify that theme dark colors are applied using static red hat developer theme plugin and make screenshots", async ({}, testInfo: TestInfo) => {
    await themeVerifier.setTheme("Dark");
    await themeVerifier.verifyHeaderGradient(
      "none, linear-gradient(90deg, rgb(190, 122, 45), rgb(45, 190, 50))",
    );
    await themeVerifier.verifyBorderLeftColor("rgb(45, 113, 190)");
    await themeVerifier.takeScreenshotAndAttach(
      "screenshots/custom-theme-dark-inspection.png",
      testInfo,
      "custom-theme-dark-inspection",
    );
    await themeVerifier.verifyPrimaryColors("#DC6ED9");
  });

  // eslint-disable-next-line no-empty-pattern
  test("Verify that theme light colors are applied using custom dynamic theme plugin and make screenshots", async ({}, testInfo: TestInfo) => {
    await themeVerifier.setTheme("Light Dynamic");
    await themeVerifier.verifyHeaderGradient(
      "none, linear-gradient(90deg, rgb(248, 248, 248), rgb(248, 248, 248))",
    );
    await themeVerifier.verifyBorderLeftColor("rgb(255, 95, 21)");
    await themeVerifier.takeScreenshotAndAttach(
      "screenshots/custom-theme-light-inspection.png",
      testInfo,
      "custom-theme-light-inspection",
    );
    await themeVerifier.verifyPrimaryColors("rgb(255, 95, 21)");
  });

  // eslint-disable-next-line no-empty-pattern
  test("Verify that theme dark colors are applied using custom dynamic theme plugin and make screenshots", async ({}, testInfo: TestInfo) => {
    await themeVerifier.setTheme("Dark Dynamic");
    await themeVerifier.verifyHeaderGradient(
      "none, linear-gradient(90deg, rgb(0, 0, 208), rgb(255, 246, 140))",
    );
    await themeVerifier.verifyBorderLeftColor("rgb(244, 238, 169)");
    await themeVerifier.takeScreenshotAndAttach(
      "screenshots/custom-theme-dark-inspection.png",
      testInfo,
      "custom-theme-dark-inspection",
    );
    await themeVerifier.verifyPrimaryColors("#ab75cf");
  });

  test("Verify that tab icon for Backstage can be customized", async () => {
    expect(await page.locator("#dynamic-favicon").getAttribute("href")).toEqual(
      customTabIcon,
    );
  });

  test("Verify that brand icon for Backstage can be customized", async () => {
    expect(await page.getByTestId("home-logo").getAttribute("src")).toEqual(
      customBrandIcon,
    );
  });

  test("Verify that title for Backstage can be customized", async () => {
    await expect(page).toHaveTitle(/Red Hat Developer Hub/);
  });
});
