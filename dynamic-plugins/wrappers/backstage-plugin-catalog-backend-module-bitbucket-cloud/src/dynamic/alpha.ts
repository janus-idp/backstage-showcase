import { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';
import catalogModuleBitbucketCloudEntityProvider from '@backstage/plugin-catalog-backend-module-bitbucket-cloud/alpha';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [catalogModuleBitbucketCloudEntityProvider()],
};
