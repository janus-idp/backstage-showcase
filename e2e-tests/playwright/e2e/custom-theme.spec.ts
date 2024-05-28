import { test, Page, expect } from '@playwright/test';
import { UIhelper } from '../utils/UIhelper';
import { Common, setupBrowser } from '../utils/Common';

let page: Page;

test.describe('CustomTheme should be applied', () => {
  let common: Common;
  let uiHelper: UIhelper;

  test.beforeAll(async ({ browser }, testInfo) => {
    page = (await setupBrowser(browser, testInfo)).page;

    common = new Common(page);
    uiHelper = new UIhelper(page);

    await common.loginAsGuest();
  });

  test('Verify that theme colors are applied and make screenshots', async ({
    page,
  }, testInfo) => {
    await uiHelper.openSidebar('Settings');

    const header = await page.locator('header').first();
    await expect(header).toHaveCSS(
      'background-image',
      'none, linear-gradient(90deg, rgb(248, 248, 248), rgb(248, 248, 248))',
    );

    const screenshot_1 = await page.screenshot({
      path: 'screenshots/cusotm-theme-inspection.png',
      fullPage: true,
    });

    await testInfo.attach('screenshot', {
      body: screenshot_1,
      contentType: 'image/png',
    });

    await page.locator('[name=pin]').click();

    const screenshot_2 = await page.screenshot({
      path: 'screenshots/cusotm-theme-inspection-collapsed.png',
      fullPage: true,
    });
    await testInfo.attach('screenshot', {
      body: screenshot_2,
      contentType: 'image/png',
    });

    await common.signOut();
  });
});
