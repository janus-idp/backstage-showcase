import { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';
import { createRouter } from '@backstage/plugin-azure-devops-backend';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  router: {
    pluginID: 'azure-devops',
    createPlugin: createRouter,
  },
};
