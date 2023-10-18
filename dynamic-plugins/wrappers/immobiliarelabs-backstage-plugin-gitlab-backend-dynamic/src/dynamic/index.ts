import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
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
    if (env.config.getOptionalBoolean('enabled.gitlab') || false) {
      builder.addProcessor(new GitlabFillerProcessor(env.config));
    } else {
      env.logger.info('Gitlab plugin is disabled');
    }
  },
};
