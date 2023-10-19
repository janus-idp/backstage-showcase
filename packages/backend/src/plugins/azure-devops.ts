import { createRouter } from '@backstage/plugin-azure-devops-backend';
import type { Router } from 'express';
import type { PluginEnvironment } from '../types';

export default function createPlugin(env: PluginEnvironment): Promise<Router> {
  return createRouter({
    logger: env.logger,
    config: env.config,
    reader: env.reader,
  });
}
