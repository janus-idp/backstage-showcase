import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { loggerToWinstonLogger } from '@backstage/backend-common';
import {
  createRouter,
  DefaultSonarqubeInfoProvider,
} from '@backstage/plugin-sonarqube-backend';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () =>
    createBackendPlugin({
      pluginId: 'sonarqube',
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
                sonarqubeInfoProvider:
                  DefaultSonarqubeInfoProvider.fromConfig(config),
              }),
            );
          },
        });
      },
    })(),
};
