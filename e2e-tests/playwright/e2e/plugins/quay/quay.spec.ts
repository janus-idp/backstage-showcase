import { test } from '@playwright/test';
import { UIhelper } from '../../../utils/UIhelper';
import { Common } from '../../../utils/Common';
import { ImageRegistry } from '../../../utils/quay/quay';

test.describe.skip('Test Quay.io plugin', () => {
  const QUAY_REPOSITORY = 'janus-idp/backstage-showcase';

  test.beforeEach(async ({ page }) => {
    const common = new Common(page);
    await common.loginAsGithubUser();
  });

  test('Check if Image Registry is present', async ({ page }) => {
    const uiHelper = new UIhelper(page);
    await uiHelper.openSidebar('Catalog');
    await uiHelper.selectMuiBox('Kind', 'Component');
    await uiHelper.clickLink('Backstage Showcase');
    await uiHelper.clickTab('Image Registry');

    const allGridColumnsText = ImageRegistry.getAllGridColumnsText();
    await uiHelper.verifyRowsInTable(allGridColumnsText);
    await uiHelper.verifyHeading(`Quay repository: ${QUAY_REPOSITORY}`);

    const allCellsIdentifier = ImageRegistry.getAllCellsIdentifier();
    await uiHelper.verifyCellsInTable(allCellsIdentifier);
  });
});
