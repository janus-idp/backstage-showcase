import {
  PolicyBuilder,
  PluginIdProvider,
} from '@janus-idp/backstage-plugin-rbac-backend';
import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { loggerToWinstonLogger } from '@backstage/backend-common';
import {
  PluginIDProviderExtensionPoint,
  pluginIDProviderExtensionPoint,
} from './rbacNode';

/**
 * RBAC plugin
 *
 */
const rbacPlugin = createBackendPlugin({
  pluginId: 'permission',
  register(env) {
    const pluginIDProviderExtensionPointImpl = new (class PluginIDProviderImpl
      implements PluginIDProviderExtensionPoint
    {
      pluginIDProviders: PluginIdProvider[] = [];

      addPluginIDProvider(pluginIDProvider: PluginIdProvider): void {
        this.pluginIDProviders.push(pluginIDProvider);
      }
    })();

    env.registerExtensionPoint(
      pluginIDProviderExtensionPoint,
      pluginIDProviderExtensionPointImpl,
    );

    env.registerInit({
      deps: {
        http: coreServices.httpRouter,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        discovery: coreServices.discovery,
        identity: coreServices.identity,
        permissions: coreServices.permissions,
        tokenManager: coreServices.tokenManager,
      },
      async init({
        http,
        config,
        logger,
        discovery,
        identity,
        permissions,
        tokenManager,
      }) {
        const winstonLogger = loggerToWinstonLogger(logger);

        http.use(
          await PolicyBuilder.build(
            {
              config,
              logger: winstonLogger,
              discovery,
              identity,
              permissions,
              tokenManager,
            },
            {
              getPluginIds: () =>
                Array.from(
                  new Set(
                    pluginIDProviderExtensionPointImpl.pluginIDProviders.flatMap(
                      p => p.getPluginIds(),
                    ),
                  ),
                ),
            },
          ),
        );
      },
    });
  },
});

export default rbacPlugin;
