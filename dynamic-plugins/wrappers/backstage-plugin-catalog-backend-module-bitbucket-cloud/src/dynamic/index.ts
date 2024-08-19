import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

import { default as pluginCatalogBackendModuleBitbucketCloud } from '@backstage/plugin-catalog-backend-module-bitbucket-cloud/alpha';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [pluginCatalogBackendModuleBitbucketCloud()],
};
