import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { loggerToWinstonLogger } from '@backstage/backend-common';
import { createRouter } from '@backstage/plugin-azure-devops-backend';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () =>
    createBackendPlugin({
      pluginId: 'azure-devops',
      register(env) {
        env.registerInit({
          deps: {
            config: coreServices.rootConfig,
            logger: coreServices.logger,
            http: coreServices.httpRouter,
            reader: coreServices.urlReader,
          },
          async init({ config, logger, http, reader }) {
            http.use(
              await createRouter({
                logger: loggerToWinstonLogger(logger),
                config,
                reader,
              }),
            );
          },
        });
      },
    })(),
};
