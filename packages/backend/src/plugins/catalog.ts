import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import { jsonSchemaRefPlaceholderResolver } from '@backstage/plugin-catalog-backend-module-openapi';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-scaffolder-backend';
import { Router } from 'express';
import {
  LegacyBackendPluginInstaller,
  LegacyPluginEnvironment as PluginEnvironment,
} from '@backstage/backend-plugin-manager';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = await CatalogBuilder.create(env);

  builder.setPlaceholderResolver('openapi', jsonSchemaRefPlaceholderResolver);
  builder.setPlaceholderResolver('asyncapi', jsonSchemaRefPlaceholderResolver);

  builder.addProcessor(new ScaffolderEntitiesProcessor());

  env.pluginProvider
    .backendPlugins()
    .map(p => p.installer)
    .filter((i): i is LegacyBackendPluginInstaller => i.kind === 'legacy')
    .forEach(i => {
      if (i.catalog) {
        i.catalog(builder, env);
      }
    });

  const { processingEngine, router } = await builder.build();
  await processingEngine.start();

  return router;
}
