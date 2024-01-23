import type { Router } from 'express';
import type { LegacyPluginEnvironment as PluginEnvironment } from '@backstage/backend-dynamic-feature-service';
import {
  PolicyBuilder,
  PluginIdProvider,
} from '@janus-idp/backstage-plugin-rbac-backend';

export default async function createPlugin(
  env: PluginEnvironment,
  pluginIdProvider?: PluginIdProvider | undefined,
): Promise<Router> {
  return await PolicyBuilder.build(
    {
      config: env.config,
      logger: env.logger,
      discovery: env.discovery,
      identity: env.identity,
      permissions: env.permissions,
      tokenManager: env.tokenManager,
    },
    pluginIdProvider,
  );
}
