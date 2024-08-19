import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

import { default as pluginCatalogBackendModuleBitbucketServer } from '@backstage/plugin-catalog-backend-module-bitbucket-server/alpha';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [pluginCatalogBackendModuleBitbucketServer()],
};
