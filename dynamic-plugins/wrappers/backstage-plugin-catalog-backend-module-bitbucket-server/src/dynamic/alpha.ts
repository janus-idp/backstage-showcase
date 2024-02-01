import { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';
import catalogModuleBitbucketServerEntityProvider from '@backstage/plugin-catalog-backend-module-bitbucket-server/alpha';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [catalogModuleBitbucketServerEntityProvider()],
};
