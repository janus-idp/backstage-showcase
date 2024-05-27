import { test, expect, Page } from '@playwright/test';
import { Analytics } from '../../../utils/analytics/analytics';
import { Common, setupBrowser } from '../../../utils/Common';

let page: Page;
test.describe('Check RBAC "analytics-provider-segment" plugin', () => {
  let common = new Common(page);

  test.beforeAll(async ({ browser }, testInfo) => {
    page = (await setupBrowser(browser, testInfo)).page;

    common = new Common(page);

    await common.loginAsGithubUser();
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
