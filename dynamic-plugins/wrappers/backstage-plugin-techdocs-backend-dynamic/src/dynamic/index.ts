import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import { DefaultTechDocsCollatorFactory } from '@backstage/plugin-search-backend-module-techdocs';
import { buildRouter } from '../service/router';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  router: {
    pluginID: 'techdocs',
    createPlugin: buildRouter,
  },
  search(indexBuilder, schedule, env) {
    // collator gathers entities from techdocs.
    indexBuilder.addCollator({
      schedule,
      factory: DefaultTechDocsCollatorFactory.fromConfig(env.config, {
        discovery: env.discovery,
        logger: env.logger,
        tokenManager: env.tokenManager,
      }),
    });
  },
};
