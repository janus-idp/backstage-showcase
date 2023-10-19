import {
  LegacyBackendPluginInstaller,
  LegacyPluginEnvironment as PluginEnvironment,
} from '@backstage/backend-plugin-manager';
import { CatalogClient } from '@backstage/catalog-client';
import { ScmIntegrations } from '@backstage/integration';
import {
  createBuiltinActions,
  createRouter,
} from '@backstage/plugin-scaffolder-backend';
import {
  createGitlabGroupEnsureExistsAction,
  createGitlabProjectAccessTokenAction,
  createGitlabProjectDeployTokenAction,
  createGitlabProjectVariableAction,
} from '@backstage/plugin-scaffolder-backend-module-gitlab';
import { createArgoCdResources } from '@roadiehq/scaffolder-backend-argocd';
import {
  createAppendFileAction,
  createJSONataAction,
  createJsonJSONataTransformAction,
  createMergeAction,
  createMergeJSONAction,
  createParseFileAction,
  createReplaceInFileAction,
  createSerializeJsonAction,
  createSerializeYamlAction,
  createSleepAction,
  createWriteFileAction,
  createYamlJSONataTransformAction,
  createZipAction,
} from '@roadiehq/scaffolder-backend-module-utils';
import type { Router } from 'express';

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
    createArgoCdResources(env.config, env.logger),
    createGitlabProjectAccessTokenAction({ integrations: integrations }),
    createGitlabProjectDeployTokenAction({ integrations: integrations }),
    createGitlabProjectVariableAction({ integrations: integrations }),
    createGitlabGroupEnsureExistsAction({ integrations: integrations }),
    createAppendFileAction(),
    createJSONataAction(),
    createJsonJSONataTransformAction(),
    createMergeAction(),
    createMergeJSONAction({}),
    createParseFileAction(),
    createReplaceInFileAction(),
    createSerializeJsonAction(),
    createSerializeYamlAction(),
    createSleepAction(),
    createWriteFileAction(),
    createYamlJSONataTransformAction(),
    createZipAction(),
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
