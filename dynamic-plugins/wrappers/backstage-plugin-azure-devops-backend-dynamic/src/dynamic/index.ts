import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import { createRouter } from '@backstage/plugin-azure-devops-backend';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  router: {
    pluginID: 'azure-devops',
    createPlugin: createRouter,
  },
};
