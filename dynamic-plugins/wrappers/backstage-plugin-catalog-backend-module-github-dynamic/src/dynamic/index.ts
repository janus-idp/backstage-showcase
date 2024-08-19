import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

import { default as catalogBackendModuleGithub } from '@backstage/plugin-catalog-backend-module-github/alpha';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [catalogBackendModuleGithub()],
};
