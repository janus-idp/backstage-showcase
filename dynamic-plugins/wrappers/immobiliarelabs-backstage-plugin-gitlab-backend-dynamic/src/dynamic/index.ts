import { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';
import {
  GitlabFillerProcessor,
  createRouter,
} from '@immobiliarelabs/backstage-plugin-gitlab-backend';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'legacy',
  router: {
    pluginID: 'gitlab',
    createPlugin: createRouter,
  },
  async catalog(builder, env) {
    builder.addProcessor(new GitlabFillerProcessor(env.config));
  },
};
