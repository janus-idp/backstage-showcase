import { test, expect, Page } from '@playwright/test';
import { UIhelper } from '../utils/UIhelper';
import { Common } from '../utils/Common';
import {
  BackstageShowcase,
  CatalogImport,
} from '../support/pages/CatalogImport';

test.describe.skip('GitHub Happy path', () => {
  let page: Page;
  let common: Common;
  let uiHelper: UIhelper;
  let catalogImport: CatalogImport;
  let backstageShowcase: BackstageShowcase;

  const component =
    'https://github.com/janus-idp/backstage-showcase/blob/main/catalog-entities/all.yaml';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    uiHelper = new UIhelper(page);
    common = new Common(page);
    catalogImport = new CatalogImport(page);
    backstageShowcase = new BackstageShowcase(page);
    await common.loginAsGithubUser();
    await uiHelper.openSidebar('Catalog');
  });

  test('Verify Profile is Github Account Name in the Settings page', async () => {
    await page.goto('/settings', { waitUntil: 'load' });
    await expect(page).toHaveURL(process.env.BASE_URL + '/settings');
    await uiHelper.verifyHeading(process.env.GH_USER_ID as string);
    await uiHelper.verifyHeading(
      `User Entity: user:default/${process.env.GH_USER_ID}`,
    );
  });

  test('Register an existing component', async () => {
    const uiHelper = new UIhelper(page);
    await uiHelper.openSidebar('Catalog');
    await uiHelper.selectMuiBox('Kind', 'Component');
    await uiHelper.clickButton('Create');
    await uiHelper.clickButton('Register Existing Component');
    await catalogImport.registerExistingComponent(component);
  });

  test('Verify that the following components were ingested into the Catalog', async () => {
    await uiHelper.verifyComponentInCatalog('API', ['Petstore']);
    await uiHelper.verifyComponentInCatalog('Component', [
      'Backstage Showcase',
    ]);
    await uiHelper.verifyComponentInCatalog('Group', ['Janus-IDP Authors']);
    await uiHelper.verifyRowsInTable(['Janus-IDP Authors']);
    await uiHelper.selectMuiBox('Kind', 'Resource');
    await uiHelper.verifyRowsInTable([
      'ArgoCD',
      'GitHub Showcase repository',
      'KeyCloak',
      'PostgreSQL cluster',
      'S3 Object bucket storage',
    ]);

    await uiHelper.selectMuiBox('Kind', 'System');
    await uiHelper.verifyRowsInTable(['Janus-IDP']);

    await uiHelper.selectMuiBox('Kind', 'User');
    await uiHelper.verifyRowsInTable([
      'subhashkhileri',
      'josephca',
      'gustavolira',
      'rhdh-qe',
    ]);
  });

  test('Click login on the login popup and verify that Overview tab renders', async () => {
    await uiHelper.selectMuiBox('Kind', 'Component');
    await uiHelper.clickLink('Backstage Showcase');
    await common.clickOnGHloginPopup();
    await uiHelper.verifyLink('Janus Website', { contains: true });
    await backstageShowcase.verifyPRStatisticsRendered();
    await backstageShowcase.verifyAboutCardIsDisplayed();
  });

  test('Verify that the Issues tab renders all the open github issues in the repository', async () => {
    await uiHelper.clickTab('Issues');
    const openIssues = await backstageShowcase.getGithubOpenIssues();

    const issuesCountText = `All repositories (${openIssues.length} Issues)*`;
    await expect(page.locator(`text=${issuesCountText}`)).toBeVisible();

    for (const issue of openIssues.slice(0, 5)) {
      const issueLocator = page.locator(
        `text=${issue.title.replace(/\s+/g, ' ')}`,
      );
      await issueLocator.scrollIntoViewIfNeeded();
      await expect(issueLocator).toBeVisible();
    }
  });

  test.afterAll(async () => {
    await page.close();
  });
});
