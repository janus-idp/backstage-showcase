import { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';
import { BitbucketServerEntityProvider } from '@backstage/plugin-catalog-backend-module-bitbucket-server';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  async catalog(builder, env) {
    if (env.config.getOptionalBoolean('enabled.bitbucketServer')) {
      builder.addEntityProvider(
        BitbucketServerEntityProvider.fromConfig(env.config, {
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
      env.logger.info('Bitbucket Server plugin is disabled');
    }
  },
};
