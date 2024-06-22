import {
  createLegacyAuthAdapters,
  errorHandler,
} from '@backstage/backend-common';
import {
  BaseDynamicPlugin,
  DynamicPluginProvider,
} from '@backstage/backend-dynamic-feature-service';
import {
  DiscoveryService,
  HttpAuthService,
} from '@backstage/backend-plugin-api';
import express, { Router } from 'express';

export interface RouterOptions {
  pluginProvider: DynamicPluginProvider;
  discovery: DiscoveryService;
  httpAuth?: HttpAuthService;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { pluginProvider } = options;
  const { httpAuth } = createLegacyAuthAdapters(options);

  const router = Router();
  router.use(express.json());

  const plugins = pluginProvider.plugins();
  const dynamicPlugins = plugins.map(p => {
    // Remove the installer details for the dynamic backend plugins
    if (p.platform === 'node') {
      const { installer, ...rest } = p;
      return rest as BaseDynamicPlugin;
    }
    return p as BaseDynamicPlugin;
  });
  router.get('/loaded-plugins', async (req, response) => {
    await httpAuth.credentials(req, { allow: ['user'] });
    response.send(dynamicPlugins);
  });
  router.use(errorHandler());
  return router;
}
