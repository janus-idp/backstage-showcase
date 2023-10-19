import { CatalogClient } from '@backstage/catalog-client';
import { KubernetesBuilder } from '@backstage/plugin-kubernetes-backend';
import type { Router } from 'express';
import type { PluginEnvironment } from '../types';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const catalogApi = new CatalogClient({ discoveryApi: env.discovery });
  const { router } = await KubernetesBuilder.createBuilder({
    logger: env.logger,
    config: env.config,
    permissions: env.permissions,
    catalogApi,
  }).build();
  return router;
}
