import {
  createRouter,
  DefaultJenkinsInfoProvider,
} from '@backstage/plugin-jenkins-backend';
import { CatalogClient } from '@backstage/catalog-client';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const catalog = new CatalogClient({
    discoveryApi: env.discovery,
  });

  return await createRouter({
    logger: env.logger,
    jenkinsInfoProvider: DefaultJenkinsInfoProvider.fromConfig({
      config: env.config,
      catalog,
    }),
    permissions: env.permissions,
  });
}
