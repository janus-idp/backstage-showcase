import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { loggerToWinstonLogger } from '@backstage/backend-common';
import {
  createRouter,
  DefaultJenkinsInfoProvider,
} from '@backstage/plugin-jenkins-backend';
import { CatalogClient } from '@backstage/catalog-client';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () =>
    createBackendPlugin({
      pluginId: 'jenkins',
      register(env) {
        env.registerInit({
          deps: {
            config: coreServices.rootConfig,
            logger: coreServices.logger,
            http: coreServices.httpRouter,
            discovery: coreServices.discovery,
            permissions: coreServices.permissions,
          },
          async init({ config, logger, http, discovery, permissions }) {
            const catalog = new CatalogClient({
              discoveryApi: discovery,
            });
            http.use(
              await createRouter({
                logger: loggerToWinstonLogger(logger),
                jenkinsInfoProvider: DefaultJenkinsInfoProvider.fromConfig({
                  config: config,
                  catalog,
                }),
                permissions: permissions,
              }),
            );
          },
        });
      },
    })(),
};
