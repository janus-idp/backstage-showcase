import {
  TechRadarApi,
  type TechRadarLoaderResponse,
} from '@backstage/plugin-tech-radar';
import { CustomDataApi } from '../api/CustomDataApiClient';

export class CustomTechRadar implements TechRadarApi {
  private readonly customDataApi: CustomDataApi;
  constructor(options: { customDataApi: CustomDataApi }) {
    this.customDataApi = options.customDataApi;
  }
  async load(id: string | undefined): Promise<TechRadarLoaderResponse> {
    let data;
    try {
      data = await this.customDataApi.getTechRadarDataJson();
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
