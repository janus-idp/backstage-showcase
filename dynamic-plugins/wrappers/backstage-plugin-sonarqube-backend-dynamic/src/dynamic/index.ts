import {
  BackendDynamicPluginInstaller,
  LegacyPluginEnvironment as PluginEnvironment,
} from '@backstage/backend-dynamic-feature-service';
import {
  createRouter,
  DefaultSonarqubeInfoProvider,
} from '@backstage/plugin-sonarqube-backend';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  router: {
    pluginID: 'sonarqube',
    async createPlugin(env: PluginEnvironment) {
      return await createRouter({
        logger: env.logger,
        sonarqubeInfoProvider: DefaultSonarqubeInfoProvider.fromConfig(
          env.config,
        ),
      });
    },
  },
};
