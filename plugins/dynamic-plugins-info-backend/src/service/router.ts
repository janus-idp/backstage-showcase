import { errorHandler } from '@backstage/backend-common';
import {
  PluginManager,
  BaseDynamicPlugin,
} from '@backstage/backend-plugin-manager';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';

export interface RouterOptions {
  logger: Logger;
  pluginManager: PluginManager;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { pluginManager } = options;

  const router = Router();
  router.use(express.json());

  const plugins = pluginManager.plugins;
  const dynamicPlugins = plugins.map(p => {
    // Remove the installer details for the dynamic backend plugins
    if (p.platform === 'node') {
      const { installer, ...rest } = p;
      return rest as BaseDynamicPlugin;
    }
    return p as BaseDynamicPlugin;
  });
  router.get('/dynamic-plugins', (_, response) => {
    response.send(dynamicPlugins);
  });
  router.use(errorHandler());
  return router;
}
