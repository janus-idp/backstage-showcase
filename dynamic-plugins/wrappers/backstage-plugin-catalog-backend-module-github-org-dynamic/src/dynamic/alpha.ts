import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import catalogModuleGithubOrgEntityProvider from '@backstage/plugin-catalog-backend-module-github-org';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',

  install: () => [catalogModuleGithubOrgEntityProvider()],
};
