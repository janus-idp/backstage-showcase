import { test, expect } from '@playwright/test';
import { Analytics } from '../../../utils/analytics/analytics';

// TODO: Fix RBAC tests execution first to enable this test
test.skip('Check "analytics-provider-segment" plugin is disabled', async () => {
  const analytics = new Analytics();

  const authHeader = await analytics.getAuthHeader();
  const pluginsList = await analytics.getDynamicPluginsList(authHeader);
  const isPluginListed = analytics.checkPluginListed(
    pluginsList,
    '@janus-idp/backstage-plugin-analytics-provider-segment',
  );

  expect(isPluginListed).toBe(false);
});
