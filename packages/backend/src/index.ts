/*
 * Hi!
 *
 * Note that this is an EXAMPLE Backstage backend. Please check the README.
 *
 * Happy hacking!
 */

import {
  CacheManager,
  DatabaseManager,
  HostDiscovery,
  ServerTokenManager,
  UrlReaders,
  createServiceBuilder,
  getRootLogger,
  loadBackendConfig,
  notFoundHandler,
  useHotMemoize,
  createStatusCheckRouter,
  ServiceBuilder,
} from '@backstage/backend-common';
import { TaskScheduler } from '@backstage/backend-tasks';
import { Config } from '@backstage/config';
import { DefaultIdentityClient } from '@backstage/plugin-auth-node';
import { ServerPermissionClient } from '@backstage/plugin-permission-node';
import Router from 'express-promise-router';
import app from './plugins/app';
import auth from './plugins/auth';
import catalog from './plugins/catalog';
import events from './plugins/events';
import permission from './plugins/permission';
import proxy from './plugins/proxy';
import scaffolder from './plugins/scaffolder';
import search from './plugins/search';
import { metricsHandler } from './metrics';
import { RequestHandler } from 'express';
import {
  PluginManager,
  BackendPluginProvider,
  LegacyPluginEnvironment as PluginEnvironment,
} from '@backstage/backend-plugin-manager';
import { DefaultEventBroker } from '@backstage/plugin-events-backend';
import { createRouter as scalprumRouter } from '@internal/plugin-scalprum-backend';

// TODO(davidfestal): The following import is a temporary workaround for a bug
// in the upstream @backstage/backend-plugin-manager package.
//
// It should be removed as soon as the upstream package is fixed and released.
// see https://github.com/janus-idp/backstage-showcase/pull/600
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

  root.info(`Created UrlReader ${reader}`);

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

type AddPluginBase = {
  isOptional?: boolean;
  plugin: string;
  apiRouter: ReturnType<typeof Router>;
  createEnv: ReturnType<typeof makeCreateEnv>;
  router: (env: PluginEnvironment) => Promise<ReturnType<typeof Router>>;
  options?: { path?: string };
};

type AddPlugin = {
  isOptional?: false;
} & AddPluginBase;

type OptionalPluginOptions = {
  key?: string;
  path?: string;
};

type AddOptionalPlugin = {
  isOptional: true;
  config: Config;
  options?: OptionalPluginOptions;
} & AddPluginBase;

const OPTIONAL_DYNAMIC_PLUGINS: { [key: string]: OptionalPluginOptions } = {
  techdocs: {},
  argocd: {},
  sonarqube: {},
  kubernetes: {},
  'azure-devops': { key: 'enabled.azureDevOps' },
  jenkins: {},
  ocm: {},
  gitlab: {},
} as const satisfies { [key: string]: OptionalPluginOptions };

async function addPlugin(args: AddPlugin | AddOptionalPlugin): Promise<void> {
  const { isOptional, plugin, apiRouter, createEnv, router, options } = args;

  const isPluginEnabled =
    !isOptional ||
    args.config.getOptionalBoolean(options?.key ?? `enabled.${plugin}`) ||
    false;
  if (isPluginEnabled) {
    const pluginEnv: PluginEnvironment = useHotMemoize(module, () =>
      createEnv(plugin),
    );
    apiRouter.use(options?.path ?? `/${plugin}`, await router(pluginEnv));
    console.log(`Using backend plugin ${plugin}...`);
  } else if (isOptional) {
    console.log(`Backend plugin ${plugin} is disabled`);
  }
}

type AddRouterBase = {
  isOptional?: boolean;
  name: string;
  service: ServiceBuilder;
  root: string;
  router: RequestHandler | ReturnType<typeof Router>;
};

type AddRouterOptional = {
  isOptional: true;
  config: Config;
} & AddRouterBase;

type AddRouter = {
  isOptional?: false;
} & AddRouterBase;

async function addRouter(args: AddRouter | AddRouterOptional): Promise<void> {
  const { isOptional, name, service, root, router } = args;

  const isRouterEnabled =
    !isOptional || args.config.getOptionalBoolean(`enabled.${name}`) || false;

  if (isRouterEnabled) {
    console.log(`Adding router ${name} to backend...`);
    service.addRouter(root, router);
  }
}

async function main() {
  const logger = getRootLogger();
  const config = await loadBackendConfig({
    argv: process.argv,
    logger,
  });
  const pluginManager = await PluginManager.fromConfig(
    config,
    logger,
    undefined,
    new CommonJSModuleLoader(logger),
  );
  const createEnv = makeCreateEnv(config, pluginManager);

  const appEnv = useHotMemoize(module, () => createEnv('app'));

  const apiRouter = Router();

  // Scalprum frontend plugins provider
  const scalprumEmv = useHotMemoize(module, () => createEnv('scalprum'));
  apiRouter.use(
    '/scalprum',
    await scalprumRouter({
      logger: scalprumEmv.logger,
      pluginManager,
      discovery: scalprumEmv.discovery,
    }),
  );

  // Required plugins
  await addPlugin({ plugin: 'proxy', apiRouter, createEnv, router: proxy });
  await addPlugin({ plugin: 'auth', apiRouter, createEnv, router: auth });
  await addPlugin({ plugin: 'catalog', apiRouter, createEnv, router: catalog });
  await addPlugin({ plugin: 'search', apiRouter, createEnv, router: search });
  await addPlugin({
    plugin: 'scaffolder',
    apiRouter,
    createEnv,
    router: scaffolder,
  });
  await addPlugin({ plugin: 'events', apiRouter, createEnv, router: events });

  await addPlugin({
    plugin: 'permission',
    config,
    apiRouter,
    createEnv,
    router: permission,
    isOptional: true,
  });

  for (const plugin of pluginManager.backendPlugins()) {
    if (plugin.installer.kind === 'legacy') {
      const pluginRouter = plugin.installer.router;
      if (pluginRouter !== undefined) {
        let optionals = {};
        if (pluginRouter.pluginID in OPTIONAL_DYNAMIC_PLUGINS) {
          optionals = {
            isOptional: true,
            config: config,
            options: OPTIONAL_DYNAMIC_PLUGINS[pluginRouter.pluginID],
          };
        }
        await addPlugin({
          plugin: pluginRouter.pluginID,
          apiRouter,
          createEnv,
          router: pluginRouter.createPlugin,
          ...optionals,
        });
      }
    }
  }

  // Add backends ABOVE this line; this 404 handler is the catch-all fallback
  apiRouter.use(notFoundHandler());

  const service = createServiceBuilder(module).loadConfig(config);

  // Required routers
  await addRouter({
    name: 'api',
    service,
    root: '/api',
    router: apiRouter,
  });
  await addRouter({
    name: 'app',
    service,
    root: '',
    router: await app(appEnv),
  });
  await addRouter({
    name: 'healthcheck',
    service,
    root: '',
    router: await createStatusCheckRouter(appEnv),
  });

  // Optional routers
  await addRouter({
    name: 'metrics',
    config,
    service,
    root: '',
    router: metricsHandler(),
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
