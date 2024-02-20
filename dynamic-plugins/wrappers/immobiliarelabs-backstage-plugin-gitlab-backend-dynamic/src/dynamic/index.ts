import { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';
import {
  catalogPluginGitlabFillerProcessorModule,
  gitlabPlugin,
} from '@immobiliarelabs/backstage-plugin-gitlab-backend';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [catalogPluginGitlabFillerProcessorModule(), gitlabPlugin()],
};
