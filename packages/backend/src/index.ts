import { rootHttpRouterServiceFactory } from '@backstage/backend-app-api';
import { statusCheckHandler } from '@backstage/backend-common';
import { createBackend } from '@backstage/backend-defaults';
import {
  dynamicPluginsFeatureDiscoveryServiceFactory,
  dynamicPluginsFrontendSchemas,
  dynamicPluginsSchemasServiceFactory,
  dynamicPluginsServiceFactory,
} from '@backstage/backend-dynamic-feature-service';
import { PackageRoles } from '@backstage/cli-node';
import { RequestHandler } from 'express';
import * as path from 'path';
import { CommonJSModuleLoader } from './loader';
import { customLogger } from './logger';
import { metricsHandler } from './metrics';
import {
  pluginIDProviderService,
  rbacDynamicPluginsProvider,
} from './modules/rbacDynamicPluginsModule';
import { bootstrap } from 'global-agent';
import { Agent, ProxyAgent, Dispatcher, setGlobalDispatcher } from 'undici';

// RHIDP-2217: adds support for corporate proxy
configureCorporateProxyAgent();

const backend = createBackend();

backend.add(
  rootHttpRouterServiceFactory({
    configure(context) {
      let healthCheckHandler: RequestHandler | undefined;

      const { app, routes, middleware } = context;
      app.use(middleware.helmet());
      app.use(middleware.cors());
      app.use(middleware.compression());
      app.use(middleware.logging());
      app.use('/healthcheck', async (_, response, next) => {
        if (!healthCheckHandler) {
          healthCheckHandler = await statusCheckHandler();
        }
        healthCheckHandler(_, response, next);
      });
      app.use('/metrics', metricsHandler());
      app.use(routes);
      app.use(middleware.notFound());
      app.use(middleware.error());
    },
  }),
);
backend.add(dynamicPluginsFeatureDiscoveryServiceFactory()); // overridden version of the FeatureDiscoveryService which provides features loaded by dynamic plugins
backend.add(
  dynamicPluginsServiceFactory({
    moduleLoader: logger => new CommonJSModuleLoader(logger),
  }),
);

backend.add(
  dynamicPluginsSchemasServiceFactory({
    schemaLocator(pluginPackage) {
      const platform = PackageRoles.getRoleInfo(
        pluginPackage.manifest.backstage.role,
      ).platform;
      return path.join(
        platform === 'node' ? 'dist' : 'dist-scalprum',
        'configSchema.json',
      );
    },
  }),
);
backend.add(dynamicPluginsFrontendSchemas());
backend.add(customLogger());

backend.add(import('@backstage/plugin-app-backend/alpha'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);

backend.add(import('@backstage/plugin-catalog-backend/alpha'));

// TODO: Probably we should now provide this as a dynamic plugin
backend.add(import('@backstage/plugin-catalog-backend-module-openapi'));

backend.add(import('@backstage/plugin-proxy-backend/alpha'));

// TODO: Check in the Scaffolder new backend plugin why the identity is not passed and the default is built instead.
backend.add(import('@backstage/plugin-scaffolder-backend/alpha'));

backend.add(import('@backstage/plugin-search-backend/alpha'));
backend.add(import('@backstage/plugin-search-backend-module-catalog/alpha'));

// TODO: We should test it more deeply. The structure is not exactly the same as the old backend implementation
backend.add(import('@backstage/plugin-events-backend/alpha'));

backend.add(import('@janus-idp/backstage-plugin-rbac-backend'));
backend.add(
  import('@janus-idp/backstage-scaffolder-backend-module-annotator/alpha'),
);
backend.add(pluginIDProviderService);
backend.add(rbacDynamicPluginsProvider);

backend.add(import('@backstage/plugin-auth-backend'));
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
backend.add(import('./modules/authProvidersModule'));

backend.add(import('@internal/plugin-dynamic-plugins-info-backend'));
backend.add(import('@internal/plugin-scalprum-backend'));

backend.start();

/**
 * Adds support for corporate proxy to both 'node-fetch' (using 'global-agent') and native 'fetch' (using 'undici') packages.
 */
function configureCorporateProxyAgent() {
  // Bootstrap global-agent, which addresses node-fetch proxy-ing.
  // global-agent purposely uses namespaced env vars to prevent conflicting behavior with other libraries,
  // but user can set GLOBAL_AGENT_ENVIRONMENT_VARIABLE_NAMESPACE to an empty value for global-agent to use
  // the conventional HTTP_PROXY, HTTPS_PROXY and NO_PROXY environment variables.
  // More details in https://github.com/gajus/global-agent#what-is-the-reason-global-agentbootstrap-does-not-use-http_proxy
  bootstrap();

  // Configure the undici package, which affects the native 'fetch'. It leverages the same env vars used by global-agent,
  // or the more conventional HTTP(S)_PROXY ones.
  const proxyEnv =
    process.env.GLOBAL_AGENT_HTTP_PROXY ??
    process.env.GLOBAL_AGENT_HTTPS_PROXY ??
    process.env.HTTP_PROXY ??
    process.env.http_proxy ??
    process.env.HTTPS_PROXY ??
    process.env.https_proxy;

  if (proxyEnv) {
    const proxyUrl = new URL(proxyEnv);

    // Create an access token if the proxy requires authentication
    let token: string | undefined = undefined;
    if (proxyUrl.username && proxyUrl.password) {
      const b64 = Buffer.from(
        `${proxyUrl.username}:${proxyUrl.password}`,
      ).toString('base64');
      token = `Basic ${b64}`;
    }

    // Create a default agent that will be used for no_proxy origins
    const defaultAgent = new Agent();

    // Create an interceptor that will use the appropriate agent based on the origin and the no_proxy
    // environment variable.
    // Collect the list of domains that we should not use a proxy for.
    // The only wildcard available is a single * character, which matches all hosts, and effectively disables the proxy.
    const noProxyEnv =
      process.env.GLOBAL_AGENT_NO_PROXY ??
      process.env.NO_PROXY ??
      process.env.no_proxy;
    const noProxyList = noProxyEnv?.split(',') || [];

    const isNoProxy = (origin: string | undefined): boolean => {
      for (const exclusion of noProxyList) {
        if (exclusion === '*') {
          // Effectively disables proxying
          return true;
        }
        // Matched as either a domain which contains the hostname, or the hostname itself.
        if (origin === exclusion || origin?.endsWith(`.${exclusion}`)) {
          return true;
        }
      }
      return false;
    };

    const noProxyInterceptor = (
      dispatch: Dispatcher['dispatch'],
    ): Dispatcher['dispatch'] => {
      return (opts, handler) => {
        return isNoProxy(opts.origin?.toString())
          ? defaultAgent.dispatch(opts, handler)
          : dispatch(opts, handler);
      };
    };

    // Create a proxy agent that will send all requests through the configured proxy, unless the
    // noProxyInterceptor bypasses it.
    const proxyAgent = new ProxyAgent({
      uri: proxyUrl.protocol + proxyUrl.host,
      token,
      interceptors: {
        Client: [noProxyInterceptor],
      },
    });

    // Make sure our configured proxy agent is used for all `fetch()` requests globally.
    setGlobalDispatcher(proxyAgent);
  }
}
