import {
  TechRadarApi,
  type TechRadarLoaderResponse,
} from '@backstage/plugin-tech-radar';
import { JanusBackstageCustomizeApi } from '../api';

export class CustomTechRadar implements TechRadarApi {
  private readonly janusBackstageCustomizeApi: JanusBackstageCustomizeApi;
  constructor(options: {
    janusBackstageCustomizeApi: JanusBackstageCustomizeApi;
  }) {
    this.janusBackstageCustomizeApi = options.janusBackstageCustomizeApi;
  }
  async load(id: string | undefined): Promise<TechRadarLoaderResponse> {
    let data;
    try {
      data = await this.janusBackstageCustomizeApi.getTechRadarDataJson();
    } catch (e) {
      const res = await fetch(`/tech-radar/data-${id}.json`);
      data = (await res.json()) as TechRadarLoaderResponse;
    }

    return {
      ...data,
      entries: data.entries.map(entry => ({
        ...entry,
        timeline: entry.timeline.map(timeline => ({
          ...timeline,
          date: new Date(timeline.date),
        })),
      })),
    };
  }
}
