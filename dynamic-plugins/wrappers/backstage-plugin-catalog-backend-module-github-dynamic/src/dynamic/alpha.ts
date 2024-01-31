import { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';
import catalogModuleGithubEntityProvider from '@backstage/plugin-catalog-backend-module-github/alpha';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',

  install: () => [catalogModuleGithubEntityProvider()],
};
