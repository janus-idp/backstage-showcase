import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import { buildRouter } from '../service/router';
import { DefaultTechDocsCollatorFactory } from '@backstage/plugin-search-backend-module-techdocs';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  router: {
    pluginID: 'techdocs',
    createPlugin: buildRouter,
  },
  search(indexBuilder, schedule, env) {
    if (env.config.getOptionalBoolean('enabled.gitlab') || false) {
      // collator gathers entities from techdocs.
      indexBuilder.addCollator({
        schedule,
        factory: DefaultTechDocsCollatorFactory.fromConfig(env.config, {
          discovery: env.discovery,
          logger: env.logger,
          tokenManager: env.tokenManager,
        }),
      });
    } else {
      env.logger.info('Techdocs plugin is disabled');
    }
  },
};
