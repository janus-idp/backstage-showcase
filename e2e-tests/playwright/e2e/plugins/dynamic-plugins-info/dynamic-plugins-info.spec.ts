import { test } from '@playwright/test';
import { UIhelper } from '../../../utils/UIhelper';
import { Common } from '../../../utils/Common';

test.describe('dynamic-plugins-info UI tests', () => {
  let uiHelper: UIhelper;
  let common: Common;

  test.beforeEach(async ({ page }) => {
    uiHelper = new UIhelper(page);
    common = new Common(page);
    await common.loginAsGuest();
    await uiHelper.openSidebar('Administration');
    await uiHelper.verifyHeading('Administration');
    await uiHelper.verifyLink('Plugins');
    await uiHelper.clickTab('Plugins');
  });

  test('it should show a table and have a support button, the table should contain the dynamic-plugins-info plugin', async ({
    page,
  }) => {
    // what shows up in the list depends on how the instance is configured so
    // let's check for the main basic elements of the component to verify the
    // mount point is working as expected
    await uiHelper.verifyText('Installed Plugins', false);
    await uiHelper.verifyText('5 rows');
    await uiHelper.verifyText('Name');
    await uiHelper.verifyText('Version');
    await uiHelper.verifyText('Role');
    await uiHelper.clickButton('Support');
    await uiHelper.verifyText('All of the installed plugins');
    await uiHelper.clickButton('Close');

    // Check the filter and use that to verify that the table contains the
    // dynamic-plugins-info plugin, which is required for this test to run
    // properly anyways
    await page
      .getByPlaceholder('Filter')
      .pressSequentially('dynamic-plugins-info\n', { delay: 300 });
    await uiHelper.verifyRowsInTable(
      ['@janus-idp/backstage-plugin-dynamic-plugins-info'],
      true,
    );
  });
});
