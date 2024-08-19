import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { ScmIntegrations } from '@backstage/integration';

import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';

import {
  cloneAzureRepoAction,
  pushAzureRepoAction,
  pullRequestAzureRepoAction,
} from '@parfuemerie-douglas/scaffolder-backend-module-azure-repositories';

export const azureRepositoriesActions = createBackendModule({
  moduleId: 'scaffolder-backend-azure-repositories',
  pluginId: 'scaffolder',
  register(env) {
    env.registerInit({
      deps: {
        scaffolder: scaffolderActionsExtensionPoint,
        config: coreServices.rootConfig,
      },
      async init({ config, scaffolder }) {
        const integrations = ScmIntegrations.fromConfig(config) as any;
        scaffolder.addActions(
          cloneAzureRepoAction({ integrations }),
          pushAzureRepoAction({ integrations, config: config }),
          pullRequestAzureRepoAction({ integrations }),
        );
      },
    });
  },
});
