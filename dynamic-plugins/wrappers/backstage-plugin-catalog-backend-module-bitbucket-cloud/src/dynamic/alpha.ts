import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import catalogModuleBitbucketCloudEntityProvider from '@backstage/plugin-catalog-backend-module-bitbucket-cloud/alpha';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [catalogModuleBitbucketCloudEntityProvider()],
};
