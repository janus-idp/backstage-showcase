import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

import { default as pluginScaffolderBackendModuleGithub } from '@backstage/plugin-scaffolder-backend-module-github';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [pluginScaffolderBackendModuleGithub()],
};
