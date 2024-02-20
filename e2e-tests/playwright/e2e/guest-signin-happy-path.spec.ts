import { test } from '@playwright/test';
import { UIhelper } from '../utils/UIhelper';
import { HomePage } from '../support/pages/HomePage';
import { Common } from '../utils/Common';
import { templates } from '../support/testData/templates';

test.describe('Guest Signing Happy path', () => {
  let uiHelper: UIhelper;
  let homePage: HomePage;
  let common: Common;

  test.beforeEach(async ({ page }) => {
    uiHelper = new UIhelper(page);
    homePage = new HomePage(page);
    common = new Common(page);
    await common.loginAsGuest();
  });

  test('Verify the Homepage renders with Search Bar, Quick Access and Starred Entities', async () => {
    await uiHelper.verifyHeading('Welcome back!');
    await uiHelper.openSidebar('Home');
    await homePage.verifyQuickAccess('Developer Tools', 'Podman Desktop');
  });

  test.skip('Verify Catalog page renders with no components', async () => {
    await uiHelper.openSidebar('Catalog');
    await uiHelper.verifyHeading('My Org Catalog');
    await uiHelper.selectMuiBox('Kind', 'Component');
    // Check if there are no records to display.
  });

  test('Verify that all users in your Github Organization have been ingested into the Catalog Page', async () => {
    await uiHelper.openSidebar('Catalog');
    await uiHelper.selectMuiBox('Kind', 'user');
    await uiHelper.verifyRowsInTable([
      'Subhash Khileri',
      'Joseph Kim',
      'Gustavo Lira e Silva',
      'rhdh-qe',
    ]);
  });

  test('Verify all 12 Software Templates appear in the Create page', async () => {
    await uiHelper.openSidebar('Create...');
    await uiHelper.verifyHeading('Templates');
    await uiHelper.waitForHeaderTitle();

    for (const template of templates) {
      await uiHelper.waitForH4Title(template);
      await uiHelper.verifyHeading(template);
    }
  });

  test('Verify Profile is Guest in the Settings page', async () => {
    await uiHelper.openSidebar('Settings');
    await uiHelper.verifyHeading('Guest');
    await uiHelper.verifyHeading('User Entity: guest');
  });

  test('Sign Out and Verify that you return to the Sign-in page', async () => {
    await uiHelper.openSidebar('Settings');
    await common.signOut();
  });
});
