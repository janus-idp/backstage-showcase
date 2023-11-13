import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import { GithubEntityProvider } from '@backstage/plugin-catalog-backend-module-github';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  async catalog(builder, env) {
    builder.addEntityProvider(
      GithubEntityProvider.fromConfig(env.config, {
        logger: env.logger,
        scheduler: env.scheduler,
      }),
    );
  },
};
