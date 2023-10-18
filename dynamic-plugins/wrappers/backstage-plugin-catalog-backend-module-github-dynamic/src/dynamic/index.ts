import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import {
  GithubEntityProvider,
  GithubOrgEntityProvider,
} from '@backstage/plugin-catalog-backend-module-github';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  async catalog(builder, env) {
    if (env.config.getOptionalBoolean('enabled.github') || false) {
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

    if (env.config.getOptionalBoolean('enabled.githubOrg') || false) {
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

            // TODO (davidfestal): we don't have a schedule field here.
            // Its might be that this provider is be a bit old,
            // and should be replaced by GithubMultiOrgEntityProvider
            schedule: env.scheduler.createScheduledTaskRunner({
              frequency: { minutes: 60 },
              timeout: { minutes: 15 },
              initialDelay: { seconds: 15 },
            }),
          }),
        );
      });
    } else {
      env.logger.info('GithubOrg plugin is disabled');
    }
  },
};
