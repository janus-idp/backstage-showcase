import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

import { default as pluginCatalogBackendModuleGitlab } from '@backstage/plugin-catalog-backend-module-gitlab/alpha';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [pluginCatalogBackendModuleGitlab()],
};
