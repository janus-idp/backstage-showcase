import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import catalogModuleGithubEntityProvider from '@backstage/plugin-catalog-backend-module-github/alpha';
import { catalogModuleGithubOrgEntityProvider } from '@backstage/plugin-catalog-backend-module-github/alpha';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',

  // TODO(davidfestal): Check if it is correct to reuse the catalogModuleGithubOrgEntityProvider
  // which is based on GithubMultiOrgEntityProvider instead of GithubOrgEntityProvider.
  install: () => [
    catalogModuleGithubEntityProvider(),
    catalogModuleGithubOrgEntityProvider(),
  ],
};
