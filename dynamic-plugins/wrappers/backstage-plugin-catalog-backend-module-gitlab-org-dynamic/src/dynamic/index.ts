import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

import { default as pluginCatalogBackendModuleGitlabOrg } from '@backstage/plugin-catalog-backend-module-gitlab-org';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [pluginCatalogBackendModuleGitlabOrg()],
};
