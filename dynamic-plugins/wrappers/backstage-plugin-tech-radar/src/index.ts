import { techRadarApiRef } from '@backstage/plugin-tech-radar';
import { CustomTechRadar } from './api/CustomTechRadar';
import {
  configApiRef,
  createApiFactory,
  discoveryApiRef,
} from '@backstage/core-plugin-api';

export * from '@backstage/plugin-tech-radar';

export const TechRadarApi = createApiFactory({
  api: techRadarApiRef,
  deps: {
    discoveryApi: discoveryApiRef,
    configApi: configApiRef,
  },
  factory: ({ discoveryApi, configApi }) =>
    new CustomTechRadar({ discoveryApi, configApi }),
});

export { default as TechRadarIcon } from '@mui/icons-material/MyLocation';
