import { createBackend } from '@backstage/backend-defaults';
import {
  dynamicPluginsFeatureDiscoveryServiceFactory,
  dynamicPluginsFrontendSchemas,
  dynamicPluginsSchemasServiceFactory,
  dynamicPluginsServiceFactory,
} from '@backstage/backend-dynamic-feature-service';
import { PackageRoles } from '@backstage/cli-node';
import * as path from 'path';
import { configureCorporateProxyAgent } from './corporate-proxy';
import { CommonJSModuleLoader } from './loader';
import { customLogger } from './logger';
import {
  metricsPlugin,
  healthCheckPlugin,
  pluginIDProviderService,
  rbacDynamicPluginsProvider,
} from './modules';

// RHIDP-2217: adds support for corporate proxy
configureCorporateProxyAgent();

const backend = createBackend();

backend.add(dynamicPluginsFeatureDiscoveryServiceFactory); // overridden version of the FeatureDiscoveryService which provides features loaded by dynamic plugins
backend.add(
  dynamicPluginsServiceFactory({
    moduleLoader: logger => new CommonJSModuleLoader(logger),
  }),
);

backend.add(
  dynamicPluginsSchemasServiceFactory({
    schemaLocator(pluginPackage) {
      const platform = PackageRoles.getRoleInfo(
        pluginPackage.manifest.backstage.role,
      ).platform;
      return path.join(
        platform === 'node' ? 'dist' : 'dist-scalprum',
        'configSchema.json',
      );
    },
  }),
);
backend.add(dynamicPluginsFrontendSchemas);
backend.add(customLogger);

backend.add(metricsPlugin);
backend.add(healthCheckPlugin);

backend.add(import('@backstage/plugin-app-backend/alpha'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);

backend.add(import('@backstage/plugin-catalog-backend/alpha'));

// TODO: Probably we should now provide this as a dynamic plugin
backend.add(import('@backstage/plugin-catalog-backend-module-openapi'));

backend.add(import('@backstage/plugin-proxy-backend/alpha'));

// TODO: Check in the Scaffolder new backend plugin why the identity is not passed and the default is built instead.
backend.add(import('@backstage/plugin-scaffolder-backend/alpha'));

// search engine
// See https://backstage.io/docs/features/search/search-engines
backend.add(import('@backstage/plugin-search-backend-module-pg/alpha'));

// search collators
backend.add(import('@backstage/plugin-search-backend/alpha'));
backend.add(import('@backstage/plugin-search-backend-module-catalog/alpha'));

// TODO: We should test it more deeply. The structure is not exactly the same as the old backend implementation
backend.add(import('@backstage/plugin-events-backend/alpha'));

backend.add(import('@janus-idp/backstage-plugin-rbac-backend'));
backend.add(
  import('@janus-idp/backstage-scaffolder-backend-module-annotator/alpha'),
);
backend.add(pluginIDProviderService);
backend.add(rbacDynamicPluginsProvider);

backend.add(import('@backstage/plugin-auth-backend'));
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
backend.add(import('./modules/authProvidersModule'));

backend.add(import('@internal/plugin-dynamic-plugins-info-backend'));
backend.add(import('@internal/plugin-scalprum-backend'));
backend.add(import('@internal/plugin-licensed-users-info-backend'));

backend.start();
