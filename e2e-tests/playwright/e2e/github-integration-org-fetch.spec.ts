import { test } from '@playwright/test';
import { UIhelper } from '../utils/UIhelper';
import { Common } from '../utils/Common';

test.describe.serial('GitHub integration with Org data fetching', () => {
  let common: Common;
  let uiHelper: UIhelper;

  test.beforeAll(async ({ page }) => {
    uiHelper = new UIhelper(page);
    common = new Common(page);
    await common.loginAsGithubUser();
  });

  test('Verify that fetching the groups of the first org works', async () => {
    await uiHelper.openSidebar('Catalog');
    await uiHelper.selectMuiBox('Kind', 'Group');

    await uiHelper.searchInputPlaceholder('m');
    await uiHelper.verifyRowsInTable(['maintainers']);

    await uiHelper.searchInputPlaceholder('r');
    await uiHelper.verifyRowsInTable(['rhdh-qes']);
  });

  test('Verify that fetching the groups of the second org works', async () => {
    await uiHelper.searchInputPlaceholder('c');
    await uiHelper.verifyRowsInTable(['catalog-group']);

    await uiHelper.searchInputPlaceholder('j');
    await uiHelper.verifyRowsInTable(['janus-test']);
  });

  test('Verify that fetching the users of the orgs works', async () => {
    await uiHelper.openSidebar('Catalog');
    await uiHelper.selectMuiBox('Kind', 'User');

    await uiHelper.searchInputPlaceholder('r');
    await uiHelper.verifyRowsInTable(['rhdh-qe']);
  });
});
