import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import { createRouter } from '@roadiehq/backstage-plugin-argo-cd-backend';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  router: {
    pluginID: 'argocd',
    createPlugin: createRouter,
  },
};
