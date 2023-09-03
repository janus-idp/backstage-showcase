import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import {
  GithubEntityProvider,
  GithubOrgEntityProvider,
} from '@backstage/plugin-catalog-backend-module-github';
import { jsonSchemaRefPlaceholderResolver } from '@backstage/plugin-catalog-backend-module-openapi';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-scaffolder-backend';
import { GitlabDiscoveryEntityProvider } from '@backstage/plugin-catalog-backend-module-gitlab';
import { GitlabFillerProcessor } from '@immobiliarelabs/backstage-plugin-gitlab-backend';
import { KeycloakOrgEntityProvider } from '@janus-idp/backstage-plugin-keycloak-backend';
import { ManagedClusterProvider } from '@janus-idp/backstage-plugin-ocm-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import { MicrocksApiEntityProvider } from '@microcks/microcks-backstage-provider';
import { ThreeScaleApiEntityProvider } from '@janus-idp/backstage-plugin-3scale-backend';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = await CatalogBuilder.create(env);

  const isOcmEnabled = env.config.getOptionalBoolean('enabled.ocm') || false;
  const isKeycloakEnabled =
    env.config.getOptionalBoolean('enabled.keycloak') || false;
  const isGithubEnabled =
    env.config.getOptionalBoolean('enabled.github') || false;
  const isGithubOrgEnabled =
    env.config.getOptionalBoolean('enabled.githubOrg') || false;
  const isGitlabEnabled =
    env.config.getOptionalBoolean('enabled.gitlab') || false;
  const isMicrocksEnabled =
      env.config.getOptionalBoolean('enabled.microcks') || false;
  const isThreeScaleEnabled =
        env.config.getOptionalBoolean('enabled.threescale') || false;

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

  if (isGithubEnabled) {
    builder.addEntityProvider(
      GithubEntityProvider.fromConfig(env.config, {
        logger: env.logger,
        schedule: env.scheduler.createScheduledTaskRunner({
          frequency: { minutes: 30 },
          timeout: { minutes: 3 },
          initialDelay: { minutes: 1 },
        }),
      }),
    );
  }

  if (isGithubOrgEnabled) {
    const providersConfig = env.config.getOptionalConfig(
      'catalog.providers.githubOrg',
    );

    providersConfig?.keys().forEach(id => {
      const githubOrgConfig = providersConfig?.getConfig(id);

      const githubOrgId = githubOrgConfig.getString('id');
      const githubOrgUrl = githubOrgConfig.getString('orgUrl');

      builder.addEntityProvider(
        GithubOrgEntityProvider.fromConfig(env.config, {
          id: githubOrgId,
          orgUrl: githubOrgUrl,
          logger: env.logger,
          schedule: env.scheduler.createScheduledTaskRunner({
            frequency: { minutes: 60 },
            timeout: { minutes: 15 },
            initialDelay: { seconds: 15 },
          }),
        }),
      );
    });
  }

  if (isGitlabEnabled) {
    builder.addProcessor(new GitlabFillerProcessor(env.config));
    builder.addEntityProvider(
      ...GitlabDiscoveryEntityProvider.fromConfig(env.config, {
        logger: env.logger,
        schedule: env.scheduler.createScheduledTaskRunner({
          frequency: { minutes: 30 },
          timeout: { minutes: 3 },
        }),
      }),
    );
  }

  if (isMicrocksEnabled) {
    builder.addEntityProvider(
      MicrocksApiEntityProvider.fromConfig(env.config, {
        logger: env.logger,
        scheduler: env.scheduler
      }),
    );
  }

  if (isThreeScaleEnabled) {
    builder.addEntityProvider(
      ThreeScaleApiEntityProvider.fromConfig(env.config, {
        logger: env.logger,
        scheduler: env.scheduler,
      }),
    );
  }

  builder.setPlaceholderResolver('openapi', jsonSchemaRefPlaceholderResolver);
  builder.setPlaceholderResolver('asyncapi', jsonSchemaRefPlaceholderResolver);

  builder.addProcessor(new ScaffolderEntitiesProcessor());
  const { processingEngine, router } = await builder.build();
  await processingEngine.start();

  return router;
}
