import { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';
import catalogModuleGithubOrgEntityProvider from '@backstage/plugin-catalog-backend-module-github-org';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',

  install: () => [catalogModuleGithubOrgEntityProvider()],
};
