import { test, chromium, firefox } from '@playwright/test';
import { UIhelper } from '../../utils/UIhelper';
import { Common } from '../../utils/Common';

let page;
test.describe('Test ACR plugin', () => {
  let uiHelper: UIhelper;
  let common: Common;
  const dateRegex =
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{1,2},\s\d{4}/gm;
  test.beforeAll(async ({ browserName }) => {
    const browserType = browserName === 'firefox' ? firefox : chromium;
    const browser = await browserType.launch();
    page = await browser.newPage();

    uiHelper = new UIhelper(page);
    common = new Common(page);
    await common.loginAsGithubUser();
  });

  test('Verify ACR Images are visible', async () => {
    await uiHelper.openSidebar('Catalog');
    await uiHelper.verifyHeading('My Org Catalog');
    await uiHelper.selectMuiBox('Kind', 'component');
    await uiHelper.clickLink('acr-test-entity');
    await uiHelper.clickTab('Image Registry');
    await uiHelper.verifyHeading(
      'Azure Container Registry Repository: hello-world',
    );
    await uiHelper.verifyRowInTableByUniqueText('latest', [dateRegex]);
    await uiHelper.verifyRowInTableByUniqueText('v1', [dateRegex]);
    await uiHelper.verifyRowsInTable(['v2', 'v3']);
  });
});
