import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

import { default as pluginCatalogBackendModuleMSGraph } from '@backstage/plugin-catalog-backend-module-msgraph/alpha';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [pluginCatalogBackendModuleMSGraph()],
};
