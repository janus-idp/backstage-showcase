import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import { jsonSchemaRefPlaceholderResolver } from '@backstage/plugin-catalog-backend-module-openapi';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-scaffolder-backend';
import { KeycloakOrgEntityProvider } from '@janus-idp/backstage-plugin-keycloak-backend';
import { ManagedClusterProvider } from '@janus-idp/backstage-plugin-ocm-backend';
import { AapResourceEntityProvider } from '@janus-idp/backstage-plugin-aap-backend';
import { Router } from 'express';
import {
  LegacyBackendPluginInstaller,
  LegacyPluginEnvironment as PluginEnvironment,
} from '@backstage/backend-plugin-manager';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = await CatalogBuilder.create(env);

  const isOcmEnabled = env.config.getOptionalBoolean('enabled.ocm') || false;
  const isKeycloakEnabled =
    env.config.getOptionalBoolean('enabled.keycloak') || false;
  const isAapEnabled = env.config.getOptionalBoolean('enabled.aap') || false;

  if (isOcmEnabled) {
    builder.addEntityProvider(
      ManagedClusterProvider.fromConfig(env.config, {
        logger: env.logger,
        schedule: env.scheduler.createScheduledTaskRunner({
          frequency: { hours: 1 },
          timeout: { minutes: 15 },
          initialDelay: { seconds: 15 },
        }),
      }),
    );
  }

  if (isKeycloakEnabled) {
    builder.addEntityProvider(
      KeycloakOrgEntityProvider.fromConfig(env.config, {
        id: 'development',
        logger: env.logger,
        schedule: env.scheduler.createScheduledTaskRunner({
          frequency: { hours: 1 },
          timeout: { minutes: 50 },
          initialDelay: { seconds: 15 },
        }),
      }),
    );
  }

  if (isAapEnabled) {
    builder.addEntityProvider(
      AapResourceEntityProvider.fromConfig(env.config, {
        logger: env.logger,
        schedule: env.scheduler.createScheduledTaskRunner({
          frequency: { minutes: 30 },
          timeout: { minutes: 3 },
        }),
      }),
    );
  }

  builder.setPlaceholderResolver('openapi', jsonSchemaRefPlaceholderResolver);
  builder.setPlaceholderResolver('asyncapi', jsonSchemaRefPlaceholderResolver);

  builder.addProcessor(new ScaffolderEntitiesProcessor());

  env.pluginProvider
    .backendPlugins()
    .map(p => p.installer)
    .filter((i): i is LegacyBackendPluginInstaller => i.kind === 'legacy')
    .forEach(i => {
      if (i.catalog) {
        i.catalog(builder, env);
      }
    });

  const { processingEngine, router } = await builder.build();
  await processingEngine.start();

  return router;
}
