import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

import { default as pluginScaffolderBackendModuleBitbucketServer } from '@backstage/plugin-scaffolder-backend-module-bitbucket-server';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [pluginScaffolderBackendModuleBitbucketServer()],
};
