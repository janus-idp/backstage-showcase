import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

import { default as pluginScaffolderBackendModuleAzure } from '@backstage/plugin-scaffolder-backend-module-azure';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [pluginScaffolderBackendModuleAzure()],
};
