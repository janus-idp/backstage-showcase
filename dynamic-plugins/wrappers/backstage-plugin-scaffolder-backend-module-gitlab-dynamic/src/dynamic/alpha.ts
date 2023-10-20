import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { ScmIntegrations } from '@backstage/integration';
import {
  createGitlabProjectAccessTokenAction,
  createGitlabProjectDeployTokenAction,
  createGitlabProjectVariableAction,
  createGitlabGroupEnsureExistsAction,
} from '@backstage/plugin-scaffolder-backend-module-gitlab';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: createBackendModule({
    moduleId: 'scaffolder-backend-module-gitlab',
    pluginId: 'scaffolder',
    register(env) {
      env.registerInit({
        deps: {
          scaffolder: scaffolderActionsExtensionPoint,
          config: coreServices.rootConfig,
        },
        async init({ scaffolder, config }) {
          const integrations = ScmIntegrations.fromConfig(config);

          for (const action of [
            createGitlabProjectAccessTokenAction,
            createGitlabProjectDeployTokenAction,
            createGitlabProjectVariableAction,
            createGitlabGroupEnsureExistsAction,
          ]) {
            scaffolder.addActions(action({ integrations: integrations }));
          }
        },
      });
    },
  }),
};
