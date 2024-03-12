import { rootHttpRouterServiceFactory } from '@backstage/backend-app-api';
import { createBackend } from '@backstage/backend-defaults';
import { PackageRoles } from '@backstage/cli-node';
import {
  dynamicPluginsFeatureDiscoveryServiceFactory,
  dynamicPluginsServiceFactory,
  dynamicPluginsSchemasServiceFactory,
  dynamicPluginsFrontendSchemas,
  dynamicPluginsRootLoggerServiceFactory,
} from '@backstage/backend-dynamic-feature-service';
import {
  rbacDynamicPluginsProvider,
  pluginIDProviderService,
} from './modules/rbacDynamicPluginsModule';
import { metricsHandler } from './metrics';
import { statusCheckHandler } from '@backstage/backend-common';
import { RequestHandler } from 'express';
import * as path from 'path';
import { CommonJSModuleLoader } from './loader';

const backend = createBackend();

backend.add(
  rootHttpRouterServiceFactory({
    configure(context) {
      let healthCheckHandler: RequestHandler | undefined;

      const { app, routes, middleware } = context;
      app.use(middleware.helmet());
      app.use(middleware.cors());
      app.use(middleware.compression());
      app.use(middleware.logging());
      app.use('/healthcheck', async (_, response, next) => {
        if (!healthCheckHandler) {
          healthCheckHandler = await statusCheckHandler();
        }
        healthCheckHandler(_, response, next);
      });
      app.use('/metrics', metricsHandler());
      app.use(routes);
      app.use(middleware.notFound());
      app.use(middleware.error());
    },
  }),
);
backend.add(dynamicPluginsFeatureDiscoveryServiceFactory()); // overridden version of the FeatureDiscoveryService which provides features loaded by dynamic plugins
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
backend.add(dynamicPluginsFrontendSchemas());
backend.add(dynamicPluginsRootLoggerServiceFactory());

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

backend.add(import('@backstage/plugin-search-backend/alpha'));
backend.add(import('@backstage/plugin-search-backend-module-catalog/alpha'));

// TODO: We should test it more deeply. The structure is not exactly the same as the old backend implementation
backend.add(import('@backstage/plugin-events-backend/alpha'));

backend.add(import('@janus-idp/backstage-plugin-rbac-backend'));
backend.add(pluginIDProviderService);
backend.add(rbacDynamicPluginsProvider);

backend.add(import('@backstage/plugin-auth-backend'));
backend.add(import('./modules/authProvidersModule'));

backend.add(import('@internal/plugin-dynamic-plugins-info-backend'));
backend.add(import('@internal/plugin-scalprum-backend'));

backend.start();
