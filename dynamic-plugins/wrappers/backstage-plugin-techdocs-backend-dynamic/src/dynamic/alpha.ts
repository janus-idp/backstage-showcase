import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';

import {
  cacheToPluginCacheManager,
  loggerToWinstonLogger,
} from '@backstage/backend-common';
import { buildRouter } from '../service/router';
import { default as techdocsModule } from '@backstage/plugin-search-backend-module-techdocs/alpha';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [
    createBackendPlugin({
      pluginId: 'techdocs',
      register(env) {
        env.registerInit({
          deps: {
            config: coreServices.rootConfig,
            logger: coreServices.logger,
            http: coreServices.httpRouter,
            cache: coreServices.cache,
            discovery: coreServices.discovery,
            reader: coreServices.urlReader,
          },
          async init({ config, logger, http, cache, discovery, reader }) {
            http.use(
              await buildRouter({
                config,
                cache: cacheToPluginCacheManager(cache),
                discovery,
                reader,
                logger: loggerToWinstonLogger(logger),
              }),
            );
          },
        });
      },
    })(),
    techdocsModule(),
  ],
};
