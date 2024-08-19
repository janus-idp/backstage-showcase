import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

import { scaffolderModuleHttpRequest } from './plugin';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [scaffolderModuleHttpRequest()],
};
