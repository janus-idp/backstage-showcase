import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import { GitlabDiscoveryEntityProvider } from '@backstage/plugin-catalog-backend-module-gitlab';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  async catalog(builder, env) {
    if (env.config.getOptionalBoolean('enabled.gitlab') || false) {
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
    } else {
      env.logger.info('Gitlab plugin is disabled');
    }
  },
};
