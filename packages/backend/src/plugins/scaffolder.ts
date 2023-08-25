import { CatalogClient } from '@backstage/catalog-client';
import {
  createBuiltinActions,
  createRouter,
} from '@backstage/plugin-scaffolder-backend';
import { Router } from 'express';
import type { PluginEnvironment } from '../types';
import { ScmIntegrations } from '@backstage/integration';
import { createArgoCdResources } from '@roadiehq/scaffolder-backend-argocd';
import {
  createGitlabProjectAccessTokenAction,
  createGitlabProjectDeployTokenAction,
  createGitlabProjectVariableAction,
  createGitlabGroupEnsureExistsAction,
} from '@backstage/plugin-scaffolder-backend-module-gitlab';
import {
  createZipAction,
  createSleepAction,
  createWriteFileAction,
  createAppendFileAction,
  createMergeJSONAction,
  createMergeAction,
  createParseFileAction,
  createReplaceInFileAction,
  createSerializeYamlAction,
  createSerializeJsonAction,
  createJSONataAction,
  createYamlJSONataTransformAction,
  createJsonJSONataTransformAction,
} from '@roadiehq/scaffolder-backend-module-utils';

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
