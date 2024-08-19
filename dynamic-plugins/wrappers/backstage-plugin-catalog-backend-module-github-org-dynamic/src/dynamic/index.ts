import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

import { default as catalogBackendModuleGithubOrg } from '@backstage/plugin-catalog-backend-module-github-org';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [catalogBackendModuleGithubOrg()],
};
