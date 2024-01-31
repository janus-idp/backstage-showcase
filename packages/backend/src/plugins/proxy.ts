import { createRouter } from '@backstage/plugin-proxy-backend';
import type { Router } from 'express';
import type { LegacyPluginEnvironment as PluginEnvironment } from '@backstage/backend-dynamic-feature-service';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    logger: env.logger,
    config: env.config,
    discovery: env.discovery,
  });
}
