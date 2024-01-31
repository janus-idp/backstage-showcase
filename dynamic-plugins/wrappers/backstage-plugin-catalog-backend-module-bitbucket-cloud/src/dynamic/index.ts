import { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';
import { BitbucketCloudEntityProvider } from '@backstage/plugin-catalog-backend-module-bitbucket-cloud';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  async catalog(builder, env) {
    if (env.config.getOptionalBoolean('enabled.bitbucketCloud')) {
      const bitbucketCloudProvider = BitbucketCloudEntityProvider.fromConfig(
        env.config,
        {
          logger: env.logger,
          schedule: env.scheduler.createScheduledTaskRunner({
            frequency: { minutes: 30 },
            timeout: { minutes: 3 },
            initialDelay: { minutes: 1 },
          }),
          scheduler: env.scheduler,
        },
      );
      env.eventBroker.subscribe(bitbucketCloudProvider);
      builder.addEntityProvider(bitbucketCloudProvider);
    } else {
      env.logger.info('Bitbucket Cloud plugin is disabled');
    }
  },
};
