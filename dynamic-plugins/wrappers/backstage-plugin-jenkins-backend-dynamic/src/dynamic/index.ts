import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

import { default as pluginJenkinsBackend } from '@backstage-community/plugin-jenkins-backend';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [pluginJenkinsBackend()],
};
