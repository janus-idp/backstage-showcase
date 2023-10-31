import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import catalogModuleGithubEntityProvider from '@backstage/plugin-catalog-backend-module-github/alpha';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',

  install: () => [catalogModuleGithubEntityProvider()],
};
