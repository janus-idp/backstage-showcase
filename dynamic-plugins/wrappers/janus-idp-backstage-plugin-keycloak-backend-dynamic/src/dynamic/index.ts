import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import { KeycloakOrgEntityProvider } from '@janus-idp/backstage-plugin-keycloak-backend';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  async catalog(builder, env) {
    if (env.config.getOptionalBoolean('enabled.keycloak') || false) {
      builder.addEntityProvider(
        KeycloakOrgEntityProvider.fromConfig(env.config, {
          id: 'development',
          logger: env.logger,
          schedule: env.scheduler.createScheduledTaskRunner({
            frequency: { hours: 1 },
            timeout: { minutes: 50 },
            initialDelay: { seconds: 15 },
          }),
          scheduler: env.scheduler,
        }),
      );
    } else {
      env.logger.info('Keycloak plugin is disabled');
    }
  },
};
