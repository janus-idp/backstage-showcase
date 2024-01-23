import { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';
import { createRouter } from '@roadiehq/backstage-plugin-argo-cd-backend';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  router: {
    pluginID: 'argocd',
    createPlugin: createRouter,
  },
};
