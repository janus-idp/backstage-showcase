import { test } from '@playwright/test';
import { UIhelper } from '../utils/UIhelper';
import { Common } from '../utils/Common';

test.describe.serial('TechDocs', () => {
  let common: Common;
  let uiHelper: UIhelper;

  test.beforeEach(async ({ page }) => {
    uiHelper = new UIhelper(page);
    common = new Common(page);
    await common.loginAsGithubUser();
  });

  test('Verify that TechDocs is visible in sidebar', async () => {
    await uiHelper.openSidebar('Docs');
  });

  test('Verify that TechDocs for Backstage Showcase works', async ({
    page,
  }) => {
    await uiHelper.openSidebar('Docs');
    await page.getByRole('link', { name: 'Backstage Showcase' }).click();
  });
});
