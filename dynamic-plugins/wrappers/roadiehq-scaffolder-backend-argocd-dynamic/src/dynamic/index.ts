import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import { createArgoCdResources } from '@roadiehq/scaffolder-backend-argocd';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  scaffolder: env => [createArgoCdResources(env.config, env.logger)],
};
