import { test, expect } from '@playwright/test';
import { Analytics } from '../../../utils/analytics/analytics';
import { Common } from '../../../utils/Common';

test.describe('Check RBAC "analytics-provider-segment" plugin', () => {
  test.beforeEach(async ({ page }) => {
    const common = new Common(page);
    await common.loginAsGuest();
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
