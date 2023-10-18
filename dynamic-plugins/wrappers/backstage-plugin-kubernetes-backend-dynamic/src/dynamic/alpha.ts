import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { loggerToWinstonLogger } from '@backstage/backend-common';
import { KubernetesBuilder } from '@backstage/plugin-kubernetes-backend';
import { CatalogClient } from '@backstage/catalog-client';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () =>
    createBackendPlugin({
      pluginId: 'kubernetes',
      register(env) {
        env.registerInit({
          deps: {
            config: coreServices.rootConfig,
            logger: coreServices.logger,
            http: coreServices.httpRouter,
            reader: coreServices.urlReader,
            discovery: coreServices.discovery,
            permissions: coreServices.permissions,
          },
          async init({ config, logger, http, discovery, permissions }) {
            const catalogApi = new CatalogClient({ discoveryApi: discovery });
            http.use(
              (
                await KubernetesBuilder.createBuilder({
                  logger: loggerToWinstonLogger(logger),
                  config: config,
                  permissions: permissions,
                  catalogApi,
                }).build()
              ).router,
            );
          },
        });
      },
    })(),
};
