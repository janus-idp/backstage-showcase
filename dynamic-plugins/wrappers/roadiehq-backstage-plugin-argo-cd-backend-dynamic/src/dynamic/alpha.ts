import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { loggerToWinstonLogger } from '@backstage/backend-common';
import { createRouter } from '@roadiehq/backstage-plugin-argo-cd-backend';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () =>
    createBackendPlugin({
      pluginId: 'argocd',
      register(env) {
        env.registerInit({
          deps: {
            config: coreServices.config,
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
