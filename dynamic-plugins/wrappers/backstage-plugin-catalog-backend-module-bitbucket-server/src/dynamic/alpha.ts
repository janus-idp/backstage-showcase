import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import catalogModuleBitbucketServerEntityProvider from '@backstage/plugin-catalog-backend-module-bitbucket-server/alpha';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [catalogModuleBitbucketServerEntityProvider()],
};
