import {
  AnyApiFactory,
  analyticsApiRef,
  configApiRef,
  createApiFactory,
  discoveryApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import {
  ScmAuth,
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
} from '@backstage/integration-react';
import { techRadarApiRef } from '@backstage/plugin-tech-radar';
import { SegmentAnalytics } from '@janus-idp/backstage-plugin-analytics-provider-segment';
import { CustomTechRadar } from './lib/CustomTechRadar';
import {
  JanusBackstageCustomizeApiClient,
  janusBackstageCustomizeApiRef,
} from './api';

export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  ScmAuth.createDefaultApiFactory(),
  createApiFactory({
    api: analyticsApiRef,
    deps: { configApi: configApiRef, identityApi: identityApiRef },
    factory: ({ configApi, identityApi }) =>
      SegmentAnalytics.fromConfig(configApi, identityApi),
  }),
  createApiFactory({
    api: janusBackstageCustomizeApiRef,
    deps: {
      discoveryApi: discoveryApiRef,
      configApi: configApiRef,
    },
    factory: ({ discoveryApi, configApi }) =>
      new JanusBackstageCustomizeApiClient({ discoveryApi, configApi }),
  }),
  createApiFactory({
    api: techRadarApiRef,
    deps: {
      janusBackstageCustomizeApi: janusBackstageCustomizeApiRef,
    },
    factory: ({ janusBackstageCustomizeApi }) =>
      new CustomTechRadar({ janusBackstageCustomizeApi }),
  }),
];
