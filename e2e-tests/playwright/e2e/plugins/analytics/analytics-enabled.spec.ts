import { test, expect } from '@playwright/test';
import { Analytics } from '../../../utils/analytics/analytics';
import { RhdhApi } from '../../../support/api/rhdh';

test('Check "analytics-provider-segment" plugin is enabled', async () => {
  const analytics = new Analytics();
  const rhdhApi = new RhdhApi();

  const authHeader = await rhdhApi.auth().getGuestAuthHeader();
  const pluginsList = await analytics.getDynamicPluginsList(authHeader);
  const isPluginListed = analytics.checkPluginListed(
    pluginsList,
    '@janus-idp/backstage-plugin-analytics-provider-segment',
  );

  expect(isPluginListed).toBe(true);
});
