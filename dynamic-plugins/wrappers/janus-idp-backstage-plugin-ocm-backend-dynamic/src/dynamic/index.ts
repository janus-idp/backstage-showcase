import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import {
  ManagedClusterProvider,
  createRouter,
} from '@janus-idp/backstage-plugin-ocm-backend';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  router: {
    pluginID: 'ocm',
    createPlugin: createRouter,
  },
  async catalog(builder, env) {
    builder.addEntityProvider(
      ManagedClusterProvider.fromConfig(env.config, {
        logger: env.logger,
        scheduler: env.scheduler,
      }),
    );
  },
};
