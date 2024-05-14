import { techRadarApiRef } from '@backstage-community/plugin-tech-radar';
import {
  configApiRef,
  createApiFactory,
  discoveryApiRef,
} from '@backstage/core-plugin-api';
import { CustomTechRadar } from './api/CustomTechRadar';

export * from '@backstage-community/plugin-tech-radar';

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
