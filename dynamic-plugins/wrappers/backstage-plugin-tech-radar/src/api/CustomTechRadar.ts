import {
  RadarEntry,
  TechRadarApi,
  type TechRadarLoaderResponse,
} from '@backstage-community/plugin-tech-radar';
import { ConfigApi, DiscoveryApi } from '@backstage/core-plugin-api';
import defaultResponse from '../data/data-default.json';

const DEFAULT_PROXY_PATH = '/developer-hub';

type Options = {
  discoveryApi: DiscoveryApi;
  configApi: ConfigApi;
};

export class CustomTechRadar implements TechRadarApi {
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
  async load(): Promise<TechRadarLoaderResponse> {
    let data;
    const proxyUrl = await this.getBaseUrl();
    try {
      data = await this.fetcher(`${proxyUrl}/tech-radar`);
    } catch (e) {
      data = defaultResponse;
      // eslint-disable-next-line no-console
      console.log(
        'Tech Radar: Custom data source not defined, using default example data',
      );
    }

    return {
      ...data,
      entries: data.entries.map((entry: RadarEntry) => ({
        ...entry,
        timeline: entry.timeline.map(timeline => ({
          ...timeline,
          date: new Date(timeline.date),
        })),
      })),
    };
  }
}
