import { createRouter } from '@immobiliarelabs/backstage-plugin-gitlab-backend';
import { Router } from 'express-serve-static-core';

import { PluginEnvironment } from '../types';

export default async function createPlugin(env: PluginEnvironment): Promise<Router> {
  return createRouter({
    logger: env.logger,
    config: env.config,
  });
}
