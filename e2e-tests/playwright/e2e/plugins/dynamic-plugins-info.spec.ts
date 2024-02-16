import { test, expect } from '@playwright/test';
import { plugins } from '../../support/testData/dynamic-plugins-info';

test.describe('dynamic-plugins-info backend plugin', () => {
  test('should lists all the dynamic plugins installed', async ({
    request,
  }) => {
    const response = await request.get(
      '/api/dynamic-plugins-info/loaded-plugins',
    );
    const body = await response.json();

    for (const plugin of plugins) {
      const isPluginIncluded = body.find(
        resPlugin =>
          resPlugin.name === plugin.name &&
          resPlugin.role === plugin.role &&
          resPlugin.platform === plugin.platform,
      );

      expect(
        isPluginIncluded,
        `Plugin not found: ${JSON.stringify(plugin)}`,
      ).toBeTruthy();
    }
  });
});
