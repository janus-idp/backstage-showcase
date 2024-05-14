/**
 * TODO: This is a wrapper of the GitLab catalog backend module that exposes the GitlabOrgDiscoveryEntityProvider
 * This wrapper will need to be updated after the following has been completed
 * * Showcase moves to backstage 1.25 and adds support for the new events system
 * * PR #23373 from the Upstream project has been merged that introduces the GitLab org catalog backend module (https://github.com/backstage/backstage/pull/23373)
 * Updates that will need to be made:
 * * This wrapper now points to the newly created GitLab org catalog backend module
 * * * this file is removed and index.ts is updated
 */
import { loggerToWinstonLogger } from '@backstage/backend-common';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { GitlabOrgDiscoveryEntityProvider } from '@backstage/plugin-catalog-backend-module-gitlab';

export const catalogModuleGitlabOrgDiscoveryEntityProvider =
  createBackendModule({
    pluginId: 'catalog',
    moduleId: 'gitlab-org-discovery-entity-provider',
    register(env) {
      env.registerInit({
        deps: {
          config: coreServices.rootConfig,
          catalog: catalogProcessingExtensionPoint,
          logger: coreServices.logger,
          scheduler: coreServices.scheduler,
        },
        async init({ config, catalog, logger, scheduler }) {
          catalog.addEntityProvider(
            GitlabOrgDiscoveryEntityProvider.fromConfig(config, {
              logger: loggerToWinstonLogger(logger),
              scheduler,
            }),
          );
        },
      });
    },
  });
