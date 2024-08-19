import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

import { default as pluginScaffolderBackendModuleGitlab } from '@backstage/plugin-scaffolder-backend-module-gitlab';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [pluginScaffolderBackendModuleGitlab()],
};
