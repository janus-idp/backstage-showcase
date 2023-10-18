import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { KeycloakOrgEntityProvider } from '@janus-idp/backstage-plugin-keycloak-backend';
import { loggerToWinstonLogger } from '@backstage/backend-common';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: createBackendModule({
    moduleId: 'catalog-backend-module-keycloak',
    pluginId: 'catalog',
    register(env) {
      env.registerInit({
        deps: {
          catalog: catalogProcessingExtensionPoint,
          config: coreServices.rootConfig,
          logger: coreServices.logger,
          scheduler: coreServices.scheduler,
        },
        async init({ catalog, config, logger, scheduler }) {
          catalog.addEntityProvider(
            KeycloakOrgEntityProvider.fromConfig(config, {
              id: 'development',
              logger: loggerToWinstonLogger(logger),
              schedule: scheduler.createScheduledTaskRunner({
                frequency: { hours: 1 },
                timeout: { minutes: 50 },
                initialDelay: { seconds: 15 },
              }),
            }),
          );
        },
      });
    },
  }),
};
