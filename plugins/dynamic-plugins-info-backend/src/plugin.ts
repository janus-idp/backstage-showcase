import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './service/router';
import { dynamicPluginsServiceRef } from '@backstage/backend-dynamic-feature-service';

export const dynamicPluginsInfoPlugin = createBackendPlugin({
  pluginId: 'dynamic-plugins-info',
  register(env) {
    env.registerInit({
      deps: {
        http: coreServices.httpRouter,
        pluginProvider: dynamicPluginsServiceRef,
      },
      async init({ http, pluginProvider }) {
        http.use(await createRouter({ pluginProvider }));
      },
    });
  },
});
