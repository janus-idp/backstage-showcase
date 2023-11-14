import {
  createConfigSecretEnumerator,
  loadBackendConfig,
  HostDiscovery,
} from '@backstage/backend-app-api';
import {
  CacheManager,
  DatabaseManager,
  ServerTokenManager,
  ServiceBuilder,
  UrlReaders,
  createRootLogger,
  createServiceBuilder,
  createStatusCheckRouter,
  getRootLogger,
  notFoundHandler,
  useHotMemoize,
} from '@backstage/backend-common';
import {
  BackendPluginProvider,
  LegacyPluginEnvironment as PluginEnvironment,
  PluginManager,
} from '@backstage/backend-plugin-manager';
import { TaskScheduler } from '@backstage/backend-tasks';
import { Config } from '@backstage/config';
import { DefaultIdentityClient } from '@backstage/plugin-auth-node';
import { DefaultEventBroker } from '@backstage/plugin-events-backend';
import { ServerPermissionClient } from '@backstage/plugin-permission-node';
import { createRouter as dynamicPluginsInfoRouter } from '@internal/plugin-dynamic-plugins-info-backend';
import { createRouter as scalprumRouter } from '@internal/plugin-scalprum-backend';
import { RequestHandler, Router } from 'express';
import * as winston from 'winston';
import { metricsHandler } from './metrics';
import app from './plugins/app';
import auth from './plugins/auth';
import catalog from './plugins/catalog';
import events from './plugins/events';
import permission from './plugins/permission';
import proxy from './plugins/proxy';
import scaffolder from './plugins/scaffolder';
import search from './plugins/search';
import {
  createDynamicPluginsConfigSecretEnumerator,
  gatherDynamicPluginsSchemas,
} from './schemas';

// TODO(davidfestal): The following import is a temporary workaround for a bug
// in the upstream @backstage/backend-plugin-manager package.
//
// It should be removed as soon as the upstream package is fixed and released.
// see https://github.com/janus-idp/backstage-showcase/pull/600
import { WinstonLogger } from '@backstage/backend-app-api';
import { CommonJSModuleLoader } from './loader/CommonJSModuleLoader';

function makeCreateEnv(config: Config, pluginProvider: BackendPluginProvider) {
  const root = getRootLogger();
  const reader = UrlReaders.default({ logger: root, config });
  const discovery = HostDiscovery.fromConfig(config);
  const cacheManager = CacheManager.fromConfig(config);
  const databaseManager = DatabaseManager.fromConfig(config, { logger: root });
  const tokenManager = ServerTokenManager.fromConfig(config, { logger: root });
  const taskScheduler = TaskScheduler.fromConfig(config, { databaseManager });
  const eventBroker = new DefaultEventBroker(root);

  const identity = DefaultIdentityClient.create({
    discovery,
  });
  const permissions = ServerPermissionClient.fromConfig(config, {
    discovery,
    tokenManager,
  });

  // UrlReader has a toString method
  root.info(`Created UrlReader ${reader}`); // NOSONAR

  return (plugin: string): PluginEnvironment => {
    const logger = root.child({ type: 'plugin', plugin });
    const database = databaseManager.forPlugin(plugin);
    const cache = cacheManager.forPlugin(plugin);
    const scheduler = taskScheduler.forPlugin(plugin);
    return {
      logger,
      database,
      cache,
      config,
      reader,
      discovery,
      tokenManager,
      scheduler,
      permissions,
      identity,
      eventBroker,
      pluginProvider,
    };
  };
}

async function addPlugin(args: {
  plugin: string;
  apiRouter: Router;
  createEnv: ReturnType<typeof makeCreateEnv>;
  router: (env: PluginEnvironment) => Promise<Router>;
  logger: winston.Logger;
}): Promise<void> {
  const { plugin, apiRouter, createEnv, router, logger } = args;

  logger.info(`Adding plugin "${plugin}" to backend...`);
  const pluginEnv: PluginEnvironment = useHotMemoize(module, () =>
    createEnv(plugin),
  );
  apiRouter.use(`/${plugin}`, await router(pluginEnv));
}

async function addRouter(args: {
  name: string;
  service: ServiceBuilder;
  root: string;
  router: RequestHandler | Router;
  logger: winston.Logger;
}): Promise<void> {
  const { name, service, root, router, logger } = args;

  logger.info(`Adding router "${name}" to backend...`);
  service.addRouter(root, router);
}

const redacter = WinstonLogger.redacter();

async function main() {
  const logger = createRootLogger({
    format: winston.format.combine(
      redacter.format, // We use our own redacter here, in order to add additional secrets for dynamic plugins.
      process.env.NODE_ENV === 'production'
        ? winston.format.json()
        : WinstonLogger.colorFormat(),
    ),
  });

  const { config } = await loadBackendConfig({
    argv: process.argv,
  });

  const pluginManager = await PluginManager.fromConfig(
    config,
    logger,
    undefined,
    new CommonJSModuleLoader(logger),
  );

  const dynamicPluginsSchemas = await gatherDynamicPluginsSchemas(
    pluginManager,
    logger,
  );

  const secretEnumerator = {
    staticApplication: await createConfigSecretEnumerator({ logger }),
    dynamicPlugins: await createDynamicPluginsConfigSecretEnumerator(
      dynamicPluginsSchemas,
      logger,
    ),
  };

  const addSecretsInRedacter = () => {
    redacter.add([
      ...secretEnumerator.staticApplication(config),
      ...secretEnumerator.dynamicPlugins(config),
    ]);
  };
  addSecretsInRedacter();
  config.subscribe?.(() => {
    addSecretsInRedacter();
  });

  const secrets = [...secretEnumerator.dynamicPlugins(config)];
  if (secrets.length > 0) {
    getRootLogger().info(
      `The following secret related to dynamic plugin should be redacted: ${secrets[0]}`,
    );
  }

  const createEnv = makeCreateEnv(config, pluginManager);

  const appEnv = useHotMemoize(module, () => createEnv('app'));

  const apiRouter = Router();

  // Scalprum frontend plugins provider
  await addPlugin({
    plugin: 'scalprum',
    apiRouter,
    createEnv,
    router: env =>
      scalprumRouter({
        logger: env.logger,
        pluginManager,
        discovery: env.discovery,
      }),
    logger,
  });

  // Dynamic plugins info provider
  await addPlugin({
    plugin: 'dynamic-plugins-info',
    apiRouter,
    createEnv,
    router: env =>
      dynamicPluginsInfoRouter({
        logger: env.logger,
        pluginManager,
      }),
    logger,
  });

  // Required core plugins
  await addPlugin({
    plugin: 'proxy',
    apiRouter,
    createEnv,
    router: proxy,
    logger,
  });
  await addPlugin({
    plugin: 'auth',
    apiRouter,
    createEnv,
    router: auth,
    logger,
  });
  await addPlugin({
    plugin: 'catalog',
    apiRouter,
    createEnv,
    router: catalog,
    logger,
  });
  await addPlugin({
    plugin: 'search',
    apiRouter,
    createEnv,
    router: search,
    logger,
  });
  await addPlugin({
    plugin: 'scaffolder',
    apiRouter,
    createEnv,
    router: scaffolder,
    logger,
  });
  await addPlugin({
    plugin: 'events',
    apiRouter,
    createEnv,
    router: events,
    logger,
  });
  await addPlugin({
    plugin: 'permission',
    apiRouter,
    createEnv,
    router: env =>
      permission(env, {
        getPluginIds: () => [
          'catalog', // Add the other required static plugins here
          'scaffolder',
          'permission',
          ...(pluginManager
            .backendPlugins()
            .map(p => {
              if (p.installer.kind !== 'legacy') {
                return undefined;
              }
              return p.installer.router?.pluginID;
            })
            .filter(p => p !== undefined) as string[]),
        ],
      }),
    logger,
  });

  // Load dynamic plugins
  for (const plugin of pluginManager.backendPlugins()) {
    if (plugin.installer.kind === 'legacy') {
      const pluginRouter = plugin.installer.router;
      if (pluginRouter !== undefined) {
        await addPlugin({
          plugin: pluginRouter.pluginID,
          apiRouter,
          createEnv,
          router: pluginRouter.createPlugin,
          logger,
        });
      }
    }
  }

  // Add backends ABOVE this line; this 404 handler is the catch-all fallback
  apiRouter.use(notFoundHandler());

  const service = createServiceBuilder(module).loadConfig(config);

  // Required core routers
  await addRouter({
    name: 'api',
    service,
    root: '/api',
    router: apiRouter,
    logger,
  });
  await addRouter({
    name: 'healthcheck',
    service,
    root: '',
    router: await createStatusCheckRouter(appEnv),
    logger,
  });
  await addRouter({
    name: 'metrics',
    service,
    root: '',
    router: metricsHandler(),
    logger,
  });
  await addRouter({
    name: 'app',
    service,
    root: '',
    router: await app(appEnv, dynamicPluginsSchemas),
    logger,
  });

  await service.start().catch(err => {
    console.log(err);
    process.exit(1);
  });
}

module.hot?.accept();
main().catch(error => {
  console.error('Backend failed to start up', error);
  process.exit(1);
});
