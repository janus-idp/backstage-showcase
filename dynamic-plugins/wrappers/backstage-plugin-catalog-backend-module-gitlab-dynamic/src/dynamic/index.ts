import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import { GitlabDiscoveryEntityProvider } from '@backstage/plugin-catalog-backend-module-gitlab';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  async catalog(builder, env) {
    builder.addEntityProvider(
      ...GitlabDiscoveryEntityProvider.fromConfig(env.config, {
        logger: env.logger,
        schedule: env.scheduler.createScheduledTaskRunner({
          frequency: { minutes: 30 },
          timeout: { minutes: 3 },
        }),
        scheduler: env.scheduler,
      }),
    );
  },
};
