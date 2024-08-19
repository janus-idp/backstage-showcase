import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

import { azureRepositoriesActions } from './plugin';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [azureRepositoriesActions()],
};
