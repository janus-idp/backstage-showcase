import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import {
  coreServices,
  createBackendModule,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import {
  GitlabFillerProcessor,
  createRouter,
} from '@immobiliarelabs/backstage-plugin-gitlab-backend';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { loggerToWinstonLogger } from '@backstage/backend-common';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [
    createBackendModule({
      moduleId: 'catalog-backend-module-gitlab-filler-processor',
      pluginId: 'catalog',
      register(env) {
        env.registerInit({
          deps: {
            catalog: catalogProcessingExtensionPoint,
            config: coreServices.rootConfig,
          },
          async init({ catalog, config }) {
            catalog.addProcessor(new GitlabFillerProcessor(config));
          },
        });
      },
    })(),
    createBackendPlugin({
      pluginId: 'gitlab',
      register(env) {
        env.registerInit({
          deps: {
            http: coreServices.httpRouter,
            logger: coreServices.logger,
            config: coreServices.rootConfig,
          },
          async init({ http, logger, config }) {
            http.use(
              await createRouter({
                logger: loggerToWinstonLogger(logger),
                config: config,
              }),
            );
          },
        });
      },
    })(),
  ],
};
