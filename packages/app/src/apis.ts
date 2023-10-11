import { OAuth2 } from '@backstage/core-app-api';
import {
  AnyApiFactory,
  analyticsApiRef,
  configApiRef,
  createApiFactory,
  discoveryApiRef,
  identityApiRef,
  oauthRequestApiRef,
} from '@backstage/core-plugin-api';
import {
  ScmAuth,
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
} from '@backstage/integration-react';
import { techRadarApiRef } from '@backstage/plugin-tech-radar';
import { SegmentAnalytics } from '@janus-idp/backstage-plugin-analytics-provider-segment';
import { auth0AuthApiRef, oidcAuthApiRef } from './api/AuthApiRefs';
import {
  JanusBackstageCustomizeApiClient,
  janusBackstageCustomizeApiRef,
} from './api/JanusBackstageCustomizeApiClient';
import { CustomTechRadar } from './lib/CustomTechRadar';

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
  // OIDC
  createApiFactory({
    api: oidcAuthApiRef,
    deps: {
      discoveryApi: discoveryApiRef,
      oauthRequestApi: oauthRequestApiRef,
      configApi: configApiRef,
    },
    factory: ({ discoveryApi, oauthRequestApi, configApi }) =>
      OAuth2.create({
        discoveryApi,
        oauthRequestApi,
        provider: {
          id: 'oidc',
          title: 'OIDC',
          icon: () => null,
        },
        environment: configApi.getOptionalString('auth.environment'),
      }),
  }),
  // Auth0
  createApiFactory({
    api: auth0AuthApiRef,
    deps: {
      discoveryApi: discoveryApiRef,
      oauthRequestApi: oauthRequestApiRef,
      configApi: configApiRef,
    },
    factory: ({ discoveryApi, oauthRequestApi, configApi }) =>
      OAuth2.create({
        discoveryApi,
        oauthRequestApi,
        provider: {
          id: 'auth0',
          title: 'Auth0',
          icon: () => null,
        },
        defaultScopes: ['openid', 'email', 'profile'],
        environment: configApi.getOptionalString('auth.environment'),
      }),
  }),
];
