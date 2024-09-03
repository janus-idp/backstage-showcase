import { test, Page, TestInfo, expect } from '@playwright/test';
import { Common, setupBrowser } from '../utils/Common';
import { ThemeVerifier } from '../utils/custom-theme/theme-verifier';
import { customIcon } from '../support/testData/custom-theme';

let page: Page;

test.describe('CustomTheme should be applied', () => {
  let common: Common;
  let themeVerifier: ThemeVerifier;

  test.beforeAll(async ({ browser }, testInfo) => {
    page = (await setupBrowser(browser, testInfo)).page;
    common = new Common(page);
    themeVerifier = new ThemeVerifier(page);

    await common.loginAsGuest();
  });

  // eslint-disable-next-line no-empty-pattern
  test('Verify that theme light colors are applied and make screenshots', async ({}, testInfo: TestInfo) => {
    await themeVerifier.setTheme('Light');
    await themeVerifier.verifyHeaderGradient(
      'none, linear-gradient(90deg, rgb(248, 248, 248), rgb(248, 248, 248))',
    );
    await themeVerifier.verifyBorderLeftColor('rgb(255, 95, 21)');
    await themeVerifier.takeScreenshotAndAttach(
      'screenshots/custom-theme-light-inspection.png',
      testInfo,
      'custom-theme-light-inspection',
    );
    //await themeVerifier.verifyPrimaryColors('rgb(255, 95, 21)') //TODO: comment out when the primary color issue is fixed (RHIDP-3107)
  });

  // eslint-disable-next-line no-empty-pattern
  test('Verify that theme dark colors are applied and make screenshots', async ({}, testInfo: TestInfo) => {
    await themeVerifier.setTheme('Dark');
    await themeVerifier.verifyHeaderGradient(
      'none, linear-gradient(90deg, rgb(0, 0, 208), rgb(255, 246, 140))',
    );
    await themeVerifier.verifyBorderLeftColor('rgb(244, 238, 169)');
    await themeVerifier.takeScreenshotAndAttach(
      'screenshots/custom-theme-dark-inspection.png',
      testInfo,
      'custom-theme-dark-inspection',
    );
    // await themeVerifier.verifyPrimaryColors('#ab75cf') //TODO: comment out when the primary color issue is fixed (RHIDP-3107)
  });

  test('Verify that tab icon for Backstage can be customized', async () => {
    const tabIcon = await page.locator('#dynamic-favicon').getAttribute('href');
    expect(tabIcon).toEqual(customIcon);
  });
});
