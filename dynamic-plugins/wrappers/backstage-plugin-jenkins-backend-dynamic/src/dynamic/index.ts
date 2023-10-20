import {
  BackendDynamicPluginInstaller,
  LegacyPluginEnvironment as PluginEnvironment,
} from '@backstage/backend-plugin-manager';
import {
  createRouter,
  DefaultJenkinsInfoProvider,
} from '@backstage/plugin-jenkins-backend';
import { CatalogClient } from '@backstage/catalog-client';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  router: {
    pluginID: 'jenkins',
    async createPlugin(env: PluginEnvironment) {
      const catalog = new CatalogClient({
        discoveryApi: env.discovery,
      });

      return await createRouter({
        logger: env.logger,
        jenkinsInfoProvider: DefaultJenkinsInfoProvider.fromConfig({
          config: env.config,
          catalog,
        }),
        permissions: env.permissions,
      });
    },
  },
};
