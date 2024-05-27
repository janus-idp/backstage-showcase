import { test, expect, Page } from '@playwright/test';
import { Analytics } from '../../../utils/analytics/analytics';
import { Common, setupBrowser } from '../../../utils/Common';
import { UIhelper } from '../../../utils/UIhelper';

test.describe('Check RBAC "analytics-provider-segment" plugin', () => {
  let common: Common;
  let uiHelper: UIhelper;
  let page: Page;

  test.beforeAll(async ({ browser }, testInfo) => {
    page = (await setupBrowser(browser, testInfo)).page;

    uiHelper = new UIhelper(page);
    common = new Common(page);
    await common.loginAsGithubUser();
    await uiHelper.openSidebar('Administration');
    await uiHelper.verifyHeading('Administration');
    await uiHelper.verifyLink('RBAC');
    await uiHelper.clickTab('RBAC');
  });

  test('is disabled', async () => {
    const analytics = new Analytics();
    const authHeader = await analytics.getAuthHeader();
    const pluginsList = await analytics.getDynamicPluginsList(authHeader);
    const isPluginListed = analytics.checkPluginListed(
      pluginsList,
      '@janus-idp/backstage-plugin-analytics-provider-segment',
    );

    expect(isPluginListed).toBe(false);
  });
});
