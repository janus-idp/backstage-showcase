import { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';
import { createArgoCdResources } from '@roadiehq/scaffolder-backend-argocd';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  scaffolder: env => [createArgoCdResources(env.config, env.logger)],
};
