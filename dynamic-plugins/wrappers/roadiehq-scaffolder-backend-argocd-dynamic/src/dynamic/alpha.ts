import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createArgoCdResources } from '@roadiehq/scaffolder-backend-argocd';
import { loggerToWinstonLogger } from '@backstage/backend-common';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: createBackendModule({
    moduleId: 'scaffolder-backend-argocd',
    pluginId: 'scaffolder',
    register(env) {
      env.registerInit({
        deps: {
          scaffolder: scaffolderActionsExtensionPoint,
          config: coreServices.rootConfig,
          logger: coreServices.logger,
        },
        async init({ scaffolder, config, logger }) {
          scaffolder.addActions(
            createArgoCdResources(config, loggerToWinstonLogger(logger)),
          );
        },
      });
    },
  }),
};
