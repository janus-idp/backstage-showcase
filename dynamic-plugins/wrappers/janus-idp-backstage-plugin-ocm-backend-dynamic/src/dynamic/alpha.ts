import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import {
  ManagedClusterProvider,
  ocmPlugin,
} from '@janus-idp/backstage-plugin-ocm-backend';
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
            // TODO(davidfestal): This should be coreServices.rootConfig when de dependency to
            // backend-plugin-api is upgraded.
            config: coreServices.config,
            logger: coreServices.logger,
            scheduler: coreServices.scheduler,
          },
          async init({ catalog, config, logger, scheduler }) {
            catalog.addEntityProvider(
              ManagedClusterProvider.fromConfig(config, {
                logger: loggerToWinstonLogger(logger),
                schedule: scheduler.createScheduledTaskRunner({
                  frequency: { hours: 1 },
                  timeout: { minutes: 15 },
                  initialDelay: { seconds: 15 },
                }),
                scheduler: scheduler,
              }),
            );
          },
        });
      },
    })(),
    ocmPlugin(),
  ],
};
