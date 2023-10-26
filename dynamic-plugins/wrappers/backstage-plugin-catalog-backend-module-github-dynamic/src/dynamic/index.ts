import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import { GithubEntityProvider } from '@backstage/plugin-catalog-backend-module-github';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  async catalog(builder, env) {
    if (env.config.getOptionalBoolean('enabled.github')) {
      builder.addEntityProvider(
        GithubEntityProvider.fromConfig(env.config, {
          logger: env.logger,
          schedule: env.scheduler.createScheduledTaskRunner({
            frequency: { minutes: 30 },
            timeout: { minutes: 3 },
            initialDelay: { minutes: 1 },
          }),
          scheduler: env.scheduler,
        }),
      );
    } else {
      env.logger.info('Github plugin is disabled');
    }
  },
};
