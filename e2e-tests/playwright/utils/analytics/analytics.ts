import { expect, request } from '@playwright/test';

export class Analytics {
  async getGuestToken(): Promise<string> {
    const context = await request.newContext();
    const response = await context.post('/api/auth/guest/refresh');
    expect(response.status()).toBe(200);
    const data = await response.json();
    return data.backstageIdentity.token;
  }

  async getAuthHeader(): Promise<{ [key: string]: string }> {
    const token = await this.getGuestToken();
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    return headers;
  }

  async getDynamicPluginsList(authHeader: { [key: string]: string }) {
    const context = await request.newContext();
    const loadedPluginsEndpoint = '/api/dynamic-plugins-info/loaded-plugins';
    const response = await context.get(loadedPluginsEndpoint, {
      headers: authHeader,
    });
    expect(response.status()).toBe(200);
    const plugins = await response.json();
    return plugins;
  }

  checkPluginListed(plugins: any, expected: string) {
    return plugins.some((plugin: { name: string }) => plugin.name === expected);
  }
}
