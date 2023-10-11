import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import { ScmIntegrations } from '@backstage/integration';
import { TemplateAction } from '@backstage/plugin-scaffolder-node';

import {
  createGitlabProjectAccessTokenAction,
  createGitlabProjectDeployTokenAction,
  createGitlabProjectVariableAction,
  createGitlabGroupEnsureExistsAction,
} from '@backstage/plugin-scaffolder-backend-module-gitlab';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scaffolder(env): TemplateAction<any, any>[] {
    const integrations = ScmIntegrations.fromConfig(env.config);
    return [
      createGitlabProjectAccessTokenAction({ integrations: integrations }),
      createGitlabProjectDeployTokenAction({ integrations: integrations }),
      createGitlabProjectVariableAction({ integrations: integrations }),
      createGitlabGroupEnsureExistsAction({ integrations: integrations }),
    ];
  },
};
