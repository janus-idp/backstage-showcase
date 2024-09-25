import { test, expect } from '@playwright/test';
import { Common } from '../../../utils/Common';
import { UIhelper } from '../../../utils/UIhelper';
import { Catalog } from '../../../support/pages/Catalog';

test.describe('Test Topology Plugin', () => {
  let common: Common;
  let uiHelper: UIhelper;
  let catalog: Catalog;

  test.beforeEach(async ({ page }) => {
    common = new Common(page);
    uiHelper = new UIhelper(page);
    catalog = new Catalog(page);
    await common.loginAsGuest();
  });

  test('Verify pods visibility in the Topology tab', async ({ page }) => {
    await catalog.goToBackstageJanusProject();
    await uiHelper.clickTab('Topology');
    await uiHelper.verifyText('backstage-janus');
    await uiHelper.verifyText('rhdh');
    await uiHelper.verifyText('rhdh-rbac');
    const url_button = page
      .locator('g')
      .filter({ hasText: /Open URL/ })
      .getByRole('button')
      .first();
    expect(await url_button.getAttribute('href')).toContain(
      'https://rhdh-backstage-showcase',
    );
    await page
      .locator('g')
      .filter({ hasText: /Open URL/ })
      .locator('image')
      .first()
      .click();
    await page.getByLabel('Pod').click();
    await page.getByLabel('Pod').getByText('1', { exact: true }).click();
    await uiHelper.clickTab('Details');
    await uiHelper.isTextVisible('Status');
    await uiHelper.isTextVisible('Active');
    await uiHelper.clickTab('Resources');
    await uiHelper.verifyHeading('Pods');
    await uiHelper.verifyHeading('Services');
    await uiHelper.verifyHeading('Routes');
  });
});
