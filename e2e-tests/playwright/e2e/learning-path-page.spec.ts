import { expect, test } from '@playwright/test';
import { UIhelper } from '../utils/UIhelper';
import { Common } from '../utils/Common';

test.describe('Learning Paths', () => {
  let common: Common;
  let uiHelper: UIhelper;

  test.beforeEach(async ({ page }) => {
    uiHelper = new UIhelper(page);
    common = new Common(page);
    await common.loginAsGuest();
  });

  test('Verify that links in Learning Paths for Backstage opens in a new tab', async ({
    page,
  }) => {
    test.slow();
    await uiHelper.openSidebar('Learning Paths');

    for (let i = 0; i < 5; i++) {
      const popupPromise = page.waitForEvent('popup');
      await page.locator(`div[class*="MuiCardHeader-root"]`).nth(i).click();
      const popup = await popupPromise;
      await popup.waitForLoadState('domcontentloaded');
      const url = await popup.evaluate('location.href');
      console.log(url);
      expect(url).not.toBe('about:blank');
      await popup.close();
    }
  });
});
