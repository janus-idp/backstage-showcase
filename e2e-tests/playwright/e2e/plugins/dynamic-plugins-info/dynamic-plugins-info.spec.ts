import { expect, test } from '@playwright/test';
import { UIhelper } from '../../../utils/UIhelper';
import { Common } from '../../../utils/Common';
import { UIhelperPO } from '../../../support/pageObjects/global-obj';

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

  test('it should show a table, and the table should contain techdocs plugins', async ({
    page,
  }) => {
    // what shows up in the list depends on how the instance is configured so
    // let's check for the main basic elements of the component to verify the
    // mount point is working as expected
    await uiHelper.verifyText('Plugins (52)');
    await uiHelper.verifyText('5 rows');
    await uiHelper.verifyColumnHeading(
      ['Name', 'Version', 'Enabled', 'Preinstalled', 'Role'],
      true,
    );

    // A plugin is not enabled but preinstalled by default
    const row = await page.locator(
      UIhelperPO.rowByText(
        '@janus-idp/backstage-plugin-3scale-backend-dynamic',
      ),
    );
    expect(await row.locator('td').nth(2).innerText()).toBe('No'); // not enabled
    expect(await row.locator('td').nth(3).innerText()).toBe('Yes'); // preinstalled

    // Check the filter and use that to verify that the table contains the
    // dynamic-plugins-info plugin, which is required for this test to run
    // properly anyways
    await page
      .getByPlaceholder('Filter')
      .pressSequentially('techdocs\n', { delay: 300 });
    await uiHelper.verifyRowsInTable(['backstage-plugin-techdocs'], true);
  });
  test.skip('it should have a plugin-todo-list plugin which is Enabled but not Preinstalled', async () => {
    await uiHelper.verifyRowInTableByUniqueText('@internal/plugin-todo-list', [
      'Yes',
      'No',
    ]);
  });
});
