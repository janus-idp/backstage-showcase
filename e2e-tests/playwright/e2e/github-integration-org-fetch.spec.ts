import { test, Page } from '@playwright/test';
import { UIhelper } from '../utils/UIhelper';
import { Common, setupBrowser } from '../utils/Common';

let page: Page;
test.describe.serial('GitHub integration with Org data fetching', () => {
  let common: Common;
  let uiHelper: UIhelper;

  test.beforeAll(async ({ browser }, testInfo) => {
    page = (await setupBrowser(browser, testInfo)).page;
    uiHelper = new UIhelper(page);
    common = new Common(page);
    await common.loginAsGithubUser();
  });

  test('Verify that fetching the groups of the org works', async () => {
    await uiHelper.openSidebar('Catalog');
    await uiHelper.selectMuiBox('Kind', 'Group');

    await uiHelper.searchInputPlaceholder('m');
    await uiHelper.verifyRowsInTable(['maintainers']);

    await uiHelper.searchInputPlaceholder('r');
    await uiHelper.verifyRowsInTable(['rhdh-qes']);
  });

  test('Verify that fetching the users of the org works', async () => {
    await uiHelper.openSidebar('Catalog');
    await uiHelper.selectMuiBox('Kind', 'User');

    await uiHelper.searchInputPlaceholder('A');
    await uiHelper.verifyRowsInTable(['Alessandro Barbarossa']);

    await uiHelper.searchInputPlaceholder('G');
    await uiHelper.verifyRowsInTable(['Gustavo Lira e Silva']);

    await uiHelper.searchInputPlaceholder('J');
    await uiHelper.verifyRowsInTable(['Joseph Kim']);

    await uiHelper.searchInputPlaceholder('O');
    await uiHelper.verifyRowsInTable(['Omar Al Jaljuli']);

    await uiHelper.searchInputPlaceholder('r');
    await uiHelper.verifyRowsInTable(['rhdh-qe']);

    await uiHelper.searchInputPlaceholder('S');
    await uiHelper.verifyRowsInTable(['Subhash Khileri']);

    await uiHelper.searchInputPlaceholder('z');
    await uiHelper.verifyRowsInTable(['Frank Kong']);
    await uiHelper.verifyRowsInTable(['Zbyněk Drápela']);
  });
});
