import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './service/router';
import {
  DynamicPluginManager,
  dynamicPluginsServiceRef,
} from '@backstage/backend-dynamic-feature-service';

export const scalprumPlugin = createBackendPlugin({
  pluginId: 'scalprum',
  register(env) {
    env.registerInit({
      deps: {
        http: coreServices.httpRouter,
        discovery: coreServices.discovery,
        logger: coreServices.logger,
        pluginProvider: dynamicPluginsServiceRef,
      },
      async init({ http, discovery, logger, pluginProvider }) {
        http.use(
          await createRouter({
            logger,
            pluginManager: pluginProvider as DynamicPluginManager,
            discovery,
          }),
        );
      },
    });
  },
});
