import { CatalogClient } from '@backstage/catalog-client';
import {
  createBuiltinActions,
  createRouter,
} from '@backstage/plugin-scaffolder-backend';
import { Router } from 'express';
import { ScmIntegrations } from '@backstage/integration';
import {
  LegacyBackendPluginInstaller,
  LegacyPluginEnvironment as PluginEnvironment,
} from '@backstage/backend-plugin-manager';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const catalogClient = new CatalogClient({
    discoveryApi: env.discovery,
  });
  const integrations = ScmIntegrations.fromConfig(env.config);

  const builtInActions = createBuiltinActions({
    integrations,
    catalogClient,
    config: env.config,
    reader: env.reader,
  });

  const actions = [
    ...builtInActions,
    ...env.pluginProvider
      .backendPlugins()
      .map(p => p.installer)
      .filter((i): i is LegacyBackendPluginInstaller => i.kind === 'legacy')
      .flatMap(({ scaffolder }) => {
        if (scaffolder) {
          return scaffolder(env);
        }
        return [];
      }),
  ];

  return await createRouter({
    actions,
    logger: env.logger,
    config: env.config,
    database: env.database,
    reader: env.reader,
    catalogClient,
    identity: env.identity,
    permissions: env.permissions,
  });
}
