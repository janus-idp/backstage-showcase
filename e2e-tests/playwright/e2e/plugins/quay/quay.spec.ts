import { expect, test } from '@playwright/test';
import { UIhelper } from '../../../utils/UIhelper';
import { Common } from '../../../utils/Common';
import { ImageRegistry } from '../../../utils/quay/quay';
import { SHOWCASE_REPO } from '../../../utils/constants';

test.describe.skip('Test Quay.io plugin', () => {
  let uiHelper: UIhelper;

  test.beforeEach(async ({ page }) => {
    const common = new Common(page);
    await common.loginAsGuest();

    uiHelper = new UIhelper(page);
    await uiHelper.openSidebar('Catalog');
    await uiHelper.selectMuiBox('Kind', 'Component');
    await uiHelper.clickByDataTestId('user-picker-all');
    await uiHelper.clickLink('backstage-janus');
    await uiHelper.clickTab('Image Registry');
  });

  test('Check if Image Registry is present', async () => {
    const allGridColumnsText = ImageRegistry.getAllGridColumnsText();
    await uiHelper.verifyColumnHeading(allGridColumnsText);
    await uiHelper.verifyHeading(`Quay repository: ${SHOWCASE_REPO}`);

    const allCellsIdentifier = ImageRegistry.getAllCellsIdentifier();
    await uiHelper.verifyCellsInTable(allCellsIdentifier);
  });

  test('Check Security Scan details', async ({ page }) => {
    const cell = await ImageRegistry.getScanCell(page);
    const resultText = await cell.textContent();

    if (resultText.includes('unsupported')) {
      await expect(cell.getByRole('link')).toHaveCount(0);
    } else {
      await cell.getByRole('link').click();
      await uiHelper.verifyHeading('Vulnerabilities for sha256:');
      await uiHelper.verifyColumnHeading(ImageRegistry.getAllScanColumnsText());

      if (resultText.includes('Passed')) {
        await uiHelper.verifyCellsInTable(['No records to display']);
      } else {
        await uiHelper.verifyCellsInTable(
          ImageRegistry.getScanCellsIdentifier(),
        );
      }
    }
  });
});
