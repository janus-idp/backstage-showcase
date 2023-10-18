import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
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

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: createBackendModule({
    moduleId: 'scaffolder-backend-module-utils',
    pluginId: 'scaffolder',
    register(env) {
      env.registerInit({
        deps: {
          scaffolder: scaffolderActionsExtensionPoint,
          discovery: coreServices.discovery,
        },
        async init({ scaffolder }) {
          for (const action of [
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
          ]) {
            scaffolder.addActions(action({}));
          }
        },
      });
    },
  }),
};
