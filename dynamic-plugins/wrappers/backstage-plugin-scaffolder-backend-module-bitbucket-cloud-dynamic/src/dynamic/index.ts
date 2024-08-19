import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

import { default as pluginScaffolderBackendModuleBitbucketCloud } from '@backstage/plugin-scaffolder-backend-module-bitbucket-cloud';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [pluginScaffolderBackendModuleBitbucketCloud()],
};
