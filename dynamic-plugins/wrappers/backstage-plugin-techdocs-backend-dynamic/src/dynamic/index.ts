import { default as techdocsPlugin } from '@backstage/plugin-techdocs-backend/alpha';
import { default as techdocsSearchModule } from '@backstage/plugin-search-backend-module-techdocs/alpha';
import { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [techdocsPlugin(), techdocsSearchModule()],
};
