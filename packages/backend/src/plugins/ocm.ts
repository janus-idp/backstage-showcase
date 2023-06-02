import { Router } from 'express';

import { createRouter } from '@janus-idp/backstage-plugin-ocm-backend';

import { PluginEnvironment } from '../types';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    logger: env.logger,
    config: env.config,
  });
}
