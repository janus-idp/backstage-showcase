import { expect, Page, test } from '@playwright/test';

import { UIhelperPO } from '../support/pageObjects/global-obj';
import { UIhelper } from '../utils/UIhelper';
import { Common, setupBrowser } from '../utils/Common';

let page: Page;
test.describe('Test timestamp column on Catalog', () => {
  let uiHelper: UIhelper;
  let common: Common;

  test.beforeAll(async ({ browser }, testInfo) => {
    page = (await setupBrowser(browser, testInfo)).page;

    common = new Common(page);
    uiHelper = new UIhelper(page);

    await common.loginAsGithubUser();
  });
  test('Verify `Created At` column in the Catalog Page', async () => {
    await uiHelper.openSidebar('Catalog');
    await uiHelper.verifyHeading('My Org Catalog');

    const column = page
      .locator(`${UIhelperPO.MuiTableHead}`)
      .getByText('Created At', { exact: true });
    await expect(column).toBeVisible();
  });

  test.afterAll(async () => {
    await page.close();
  });
});
