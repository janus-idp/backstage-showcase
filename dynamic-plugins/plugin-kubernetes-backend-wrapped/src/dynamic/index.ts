import {
  BackendDynamicPluginInstaller,
  LegacyPluginEnvironment as PluginEnvironment,
} from '@backstage/backend-plugin-manager';
import { KubernetesBuilder } from '@backstage/plugin-kubernetes-backend';
import { CatalogClient } from '@backstage/catalog-client';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  router: {
    pluginID: 'kubernetes',
    async createPlugin(env: PluginEnvironment) {
      const catalogApi = new CatalogClient({ discoveryApi: env.discovery });
      const { router } = await KubernetesBuilder.createBuilder({
        logger: env.logger,
        config: env.config,
        permissions: env.permissions,
        catalogApi,
      }).build();
      return router;
    },
  },
};
