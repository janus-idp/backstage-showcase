import { test, expect } from '@playwright/test';
import { Common } from '../../../utils/Common';
import { UIhelper } from '../../../utils/UIhelper';
import { UIhelperPO } from '../../../support/pageObjects/global-obj';

test.describe('Check RBAC "analytics-provider-segment" plugin', () => {
  let common: Common;
  let uiHelper: UIhelper;

  test.beforeEach(async ({ page }) => {
    uiHelper = new UIhelper(page);
    common = new Common(page);
    await common.loginAsGithubUser();
    await uiHelper.openSidebar('Administration');
    await uiHelper.verifyHeading('Administration');
    await uiHelper.verifyLink('Plugins');
    await uiHelper.clickTab('Plugins');
  });

  test('is disabled', async ({ page }) => {
    await page
      .getByPlaceholder('Filter')
      .pressSequentially('backstage-plugin-analytics-provider-segment\n', {
        delay: 300,
      });
    const row = await page.locator(
      UIhelperPO.rowByText(
        '@janus-idp/backstage-plugin-analytics-provider-segment',
      ),
    );
    expect(await row.locator('td').nth(2).innerText()).toBe('No'); // not enabled
  });
});
