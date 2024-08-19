import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

import { scaffolderBackendModuleUtils } from './plugin';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [scaffolderBackendModuleUtils()],
};
