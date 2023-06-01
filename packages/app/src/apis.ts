import {
  analyticsApiRef,
  AnyApiFactory,
  configApiRef,
  createApiFactory,
  identityApiRef,
} from '@backstage/core-plugin-api';
import { ScmAuth, ScmIntegrationsApi, scmIntegrationsApiRef } from '@backstage/integration-react';
import { techRadarApiRef } from '@backstage/plugin-tech-radar';

import { SegmentAnalytics } from '@janus-idp/backstage-plugin-analytics-provider-segment';

import { CustomTechRadar } from './lib/CustomTechRadar';

export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  ScmAuth.createDefaultApiFactory(),
  createApiFactory(techRadarApiRef, new CustomTechRadar()),
  createApiFactory({
    api: analyticsApiRef,
    deps: { configApi: configApiRef, identityApi: identityApiRef },
    factory: ({ configApi, identityApi }) => SegmentAnalytics.fromConfig(configApi, identityApi),
  }),
];
