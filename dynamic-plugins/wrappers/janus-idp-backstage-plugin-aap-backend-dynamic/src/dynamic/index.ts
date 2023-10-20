import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import { AapResourceEntityProvider } from '@janus-idp/backstage-plugin-aap-backend';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  async catalog(builder, env) {
    if (env.config.getOptionalBoolean('enabled.aap') || false) {
      builder.addEntityProvider(
        AapResourceEntityProvider.fromConfig(env.config, {
          logger: env.logger,
          schedule: env.scheduler.createScheduledTaskRunner({
            frequency: { minutes: 30 },
            timeout: { minutes: 3 },
          }),
          scheduler: env.scheduler,
        }),
      );
    } else {
      env.logger.info('AAP plugin is disabled');
    }
  },
};
