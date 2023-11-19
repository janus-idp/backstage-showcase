import {
  ConfigApi,
  createApiRef,
  DiscoveryApi,
} from '@backstage/core-plugin-api';
import { QuickAccessLinks } from '../types/types';

const DEFAULT_PROXY_PATH = '/developer-hub';

export interface CustomDataApi {
  getHomeDataJson(): Promise<QuickAccessLinks[]>;
}

export const customDataApiRef = createApiRef<CustomDataApi>({
  id: 'app.developer-hub.service',
});

export type Options = {
  discoveryApi: DiscoveryApi;
  configApi: ConfigApi;
};

export class CustomDataApiClient implements CustomDataApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly configApi: ConfigApi;

  constructor(options: Options) {
    this.discoveryApi = options.discoveryApi;
    this.configApi = options.configApi;
  }

  private async getBaseUrl() {
    const proxyPath =
      this.configApi.getOptionalString('developerHub.proxyPath') ||
      DEFAULT_PROXY_PATH;
    return `${await this.discoveryApi.getBaseUrl('proxy')}${proxyPath}`;
  }

  private async fetcher(url: string) {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(
        `failed to fetch data, status ${response.status}: ${response.statusText}`,
      );
    }
    return await response.json();
  }

  async getHomeDataJson() {
    const proxyUrl = await this.getBaseUrl();
    const data = await this.fetcher(`${proxyUrl}`);
    return data;
  }
}
