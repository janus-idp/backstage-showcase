import { errorHandler } from '@backstage/backend-common';
import {
  BaseDynamicPlugin,
  DynamicPluginProvider,
} from '@backstage/backend-dynamic-feature-service';
import express, { Router } from 'express';

export interface RouterOptions {
  pluginProvider: DynamicPluginProvider;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { pluginProvider } = options;

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
  router.get('/loaded-plugins', (_, response) => {
    response.send(dynamicPlugins);
  });
  router.use(errorHandler());
  return router;
}
