import {
  ConfigApi,
  createApiRef,
  DiscoveryApi,
  IdentityApi,
} from '@backstage/core-plugin-api';
import { LearningPathLinks, QuickAccessLinks } from '../types/types';

const DEFAULT_PROXY_PATH = '/developer-hub';

export interface CustomDataApi {
  getHomeDataJson(): Promise<QuickAccessLinks[]>;
  getLearningPathDataJson(): Promise<LearningPathLinks[]>;
}

export const customDataApiRef = createApiRef<CustomDataApi>({
  id: 'app.developer-hub.service',
});

export type Options = {
  discoveryApi: DiscoveryApi;
  configApi: ConfigApi;
  identityApi: IdentityApi;
};

export class CustomDataApiClient implements CustomDataApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly configApi: ConfigApi;
  private readonly identityApi: IdentityApi;

  constructor(options: Options) {
    this.discoveryApi = options.discoveryApi;
    this.configApi = options.configApi;
    this.identityApi = options.identityApi;
  }

  private async getBaseUrl() {
    const proxyPath =
      this.configApi.getOptionalString('developerHub.proxyPath') ||
      DEFAULT_PROXY_PATH;
    return `${await this.discoveryApi.getBaseUrl('proxy')}${proxyPath}`;
  }

  private async fetcher(url: string) {
    const { token: idToken } = await this.identityApi.getCredentials();
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(idToken && { Authorization: `Bearer ${idToken}` }),
      },
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

  async getLearningPathDataJson() {
    const proxyUrl = await this.getBaseUrl();
    const data = await this.fetcher(`${proxyUrl}/learning-paths`);
    return data;
  }
}
