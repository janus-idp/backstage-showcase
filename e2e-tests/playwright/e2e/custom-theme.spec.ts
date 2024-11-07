import { test, Page, TestInfo, expect } from "@playwright/test";
import { Common, setupBrowser } from "../utils/Common";
import { ThemeVerifier } from "../utils/custom-theme/theme-verifier";
import {
  customTabIcon,
  customBrandIcon,
} from "../support/testData/custom-theme";
import { ThemeConstants } from "../data/theme-constants";

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
  test("Verify theme colors are applied and make screenshots", async ({}, testInfo: TestInfo) => {
    const themes = ThemeConstants.getThemes();

    for (const theme of themes) {
      await themeVerifier.setTheme(theme.name);
      await themeVerifier.verifyHeaderGradient(
        `none, linear-gradient(90deg, ${theme.headerColor1}, ${theme.headerColor2})`,
      );
      await themeVerifier.verifyBorderLeftColor(theme.navigationIndicatorColor);
      await themeVerifier.takeScreenshotAndAttach(
        `screenshots/custom-theme-${theme.name}-inspection.png`,
        testInfo,
        `custom-theme-${theme.name}-inspection`,
      );
      await themeVerifier.verifyPrimaryColors(theme.primaryColor);
    }
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
