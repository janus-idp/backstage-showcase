import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

import { default as pluginAzureDevopsBackend } from '@backstage-community/plugin-azure-devops-backend';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [pluginAzureDevopsBackend()],
};
