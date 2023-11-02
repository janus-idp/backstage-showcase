import { loggerToWinstonLogger } from '@backstage/backend-common';
import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import { createRouter } from '@roadiehq/backstage-plugin-argo-cd-backend';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () =>
    createBackendPlugin({
      pluginId: 'argocd',
      register(env) {
        env.registerInit({
          deps: {
            config: coreServices.rootConfig,
            logger: coreServices.logger,
            http: coreServices.httpRouter,
          },
          async init({ config, logger, http }) {
            http.use(
              await createRouter({
                logger: loggerToWinstonLogger(logger),
                config,
              }),
            );
          },
        });
      },
    })(),
};
