import {
  TechRadarApi,
  type TechRadarLoaderResponse,
} from '@backstage/plugin-tech-radar';
import { Config } from '@backstage/config';

export class CustomTechRadar implements TechRadarApi {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async load(id: string | undefined): Promise<TechRadarLoaderResponse> {
    let result;
    let contents;

    try {
      contents = await fetch(
        `${this.baseUrl}/api/s3/tech-radar/data-default.json`,
      );

      if (contents.status === 200) {
        result = (await contents.json()) as TechRadarLoaderResponse;
      } else {
        contents = await fetch(`/tech-radar/data-${id}.json`);
        result = (await contents.json()) as TechRadarLoaderResponse;
      }
    } catch (e: any) {
      throw new Error(e);
    }

    return {
      ...result,
      entries: result.entries.map(entry => ({
        ...entry,
        timeline: entry.timeline.map(timeline => ({
          ...timeline,
          date: new Date(timeline.date),
        })),
      })),
    };
  }

  static fromConfig(config: Config) {
    return new CustomTechRadar(config.getString('backend.baseUrl'));
  }
}
