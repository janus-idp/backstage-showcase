import { test, expect } from '@playwright/test';
import { Analytics } from '../../../utils/analytics/analytics';

test('Check "analytics-provider-segment" plugin is enabled', async () => {
  const analytics = new Analytics();

  const authHeader = await analytics.getGuestAuthHeader();
  const pluginsList = await analytics.getDynamicPluginsList(authHeader);
  const isPluginListed = analytics.checkPluginListed(
    pluginsList,
    '@janus-idp/backstage-plugin-analytics-provider-segment',
  );

  expect(isPluginListed).toBe(true);
});
