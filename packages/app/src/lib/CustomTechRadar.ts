import { TechRadarApi, type TechRadarLoaderResponse } from '@backstage/plugin-tech-radar';

export class CustomTechRadar implements TechRadarApi {
  async load(id: string | undefined): Promise<TechRadarLoaderResponse> {
    const data = (await fetch(`/tech-radar/data-${id}.json`).then((res) =>
      res.json(),
    )) as TechRadarLoaderResponse;

    return {
      ...data,
      entries: data.entries.map((entry) => ({
        ...entry,
        timeline: entry.timeline.map((timeline) => ({
          ...timeline,
          date: new Date(timeline.date),
        })),
      })),
    };
  }
}
