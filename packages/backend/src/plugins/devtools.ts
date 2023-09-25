import { createRouter } from '@backstage/plugin-devtools-backend';
import { Router } from 'express';
import type { PluginEnvironment } from '../types';

export default function createPlugin(env: PluginEnvironment): Promise<Router> {
  return createRouter({
    logger: env.logger,
    config: env.config,
    permissions: env.permissions,
  });
}
