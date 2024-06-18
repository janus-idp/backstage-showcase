import { test, expect, Page } from '@playwright/test';
import { UIhelper } from '../utils/UIhelper';
import { Common, setupBrowser } from '../utils/Common';
import { CatalogImport } from '../support/pages/CatalogImport';
import { CatalogUsersPO } from '../../support/pageObjects/catalog/catalog-users-obj';


let page: Page;
test.describe.serial('GitHub integration with Org data fetching', () => {
  let common: Common;
  let uiHelper: UIhelper;
  let catalogImport: CatalogImport;

  const organizationSource =
    'https://github.com/backstage/backstage/blob/master/packages/catalog-model/examples/acme/org.yaml';

  test.beforeAll(async ({ browser }, testInfo) => {
    page = (await setupBrowser(browser, testInfo)).page;
    uiHelper = new UIhelper(page);
    common = new Common(page);
    catalogImport = new CatalogImport(page);
    await common.loginAsGithubUser();
  });

  // Unsure if this is needed, added to increase the arbitrariness of the test (to prevent the test from being dependent on other files)
  test('Register an existing organization', async() => {
    await uiHelper.openSidebar('Catalog');
    await uiHelper.selectMuiBox('Kind', 'Group');
    await uiHelper.clickButton('Create');
    await uiHelper.clickButton('Register Existing Component');
    await catalogImport.registerExistingComponent(organizationSource);
  });

  test('Verify fetching that the ingested organization works', async () => {
    const group = await CatalogUsersPO.getGroupLink(page, 'acme-corp');
    await expect(group).toBeVisible();
  });
});