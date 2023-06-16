import { createRouter } from '@backstage/plugin-permission-backend';
import {
  AuthorizeResult,
  PolicyDecision,
  isPermission,
} from '@backstage/plugin-permission-common';
import {
  catalogConditions,
  createCatalogConditionalDecision,
} from '@backstage/plugin-catalog-backend/alpha';
import {
  PermissionPolicy,
  PolicyQuery,
} from '@backstage/plugin-permission-node';
import { catalogEntityDeletePermission } from '@backstage/plugin-catalog-common/alpha';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

class ReadOnlyPermissionPolicy implements PermissionPolicy {
  async handle(request: PolicyQuery): Promise<PolicyDecision> {
    const permissions = ['catalog.entity.read', 'catalog.entity.refresh'];
    if (permissions.includes(request.permission.name)) {
      return { result: AuthorizeResult.ALLOW };
    }
    if (isPermission(request.permission, catalogEntityDeletePermission)) {
      return createCatalogConditionalDecision(
        request.permission,
        catalogConditions.hasAnnotation({ annotation: 'backstage.io/orphan' }),
      );
    }
    return { result: AuthorizeResult.DENY };
  }
}

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    config: env.config,
    logger: env.logger,
    discovery: env.discovery,
    policy: new ReadOnlyPermissionPolicy(),
    identity: env.identity,
  });
}
