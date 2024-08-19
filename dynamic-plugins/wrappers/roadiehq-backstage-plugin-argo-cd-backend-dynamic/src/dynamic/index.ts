import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

import { argocdPlugin } from './plugin';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [argocdPlugin()],
};
