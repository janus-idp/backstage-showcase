import { techRadarApiRef } from '@backstage-community/plugin-tech-radar';
import {
  configApiRef,
  createApiFactory,
  discoveryApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import { CustomTechRadar } from './api/CustomTechRadar';

export * from '@backstage-community/plugin-tech-radar';

export const TechRadarApi = createApiFactory({
  api: techRadarApiRef,
  deps: {
    discoveryApi: discoveryApiRef,
    configApi: configApiRef,
    identityApi: identityApiRef,
  },
  factory: ({ discoveryApi, configApi, identityApi }) =>
    new CustomTechRadar({ discoveryApi, configApi, identityApi }),
});

export { default as TechRadarIcon } from '@mui/icons-material/MyLocation';

