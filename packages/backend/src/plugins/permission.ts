import { createRouter } from '@backstage/plugin-permission-backend';
import {
  AuthorizeResult,
  PolicyDecision,
} from '@backstage/plugin-permission-common';
import { PermissionPolicy } from '@backstage/plugin-permission-node';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

class DefaultPermissionPolicy implements PermissionPolicy {
  async handle(): Promise<PolicyDecision> {
    return { result: AuthorizeResult.ALLOW };
  }
}

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    config: env.config,
    logger: env.logger,
    discovery: env.discovery,
    policy: new DefaultPermissionPolicy(),
    identity: env.identity,
  });
}
