import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

import { scaffolderBackendModuleArgocd } from './plugin';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [scaffolderBackendModuleArgocd()],
};
