import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';

import { DynamicPluginInfo, DynamicPluginsInfoApi } from './types';

export interface DynamicPluginsInfoClientOptions {
  discoveryApi: DiscoveryApi;
  fetchApi: FetchApi;
}

const loadedPluginsEndpoint = '/loaded-plugins';

export class DynamicPluginsInfoClient implements DynamicPluginsInfoApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: DynamicPluginsInfoClientOptions) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }
  async listLoadedPlugins(): Promise<DynamicPluginInfo[]> {
    const baseUrl = await this.discoveryApi.getBaseUrl('dynamic-plugins-info');
    const targetUrl = `${baseUrl}${loadedPluginsEndpoint}`;
    const response = await this.fetchApi.fetch(targetUrl);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`${data.message}`);
    }
    return data;
  }
}
