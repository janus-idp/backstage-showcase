import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

import { default as pluginSonarQubeBackend } from '@backstage-community/plugin-sonarqube-backend';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [pluginSonarQubeBackend()],
};
