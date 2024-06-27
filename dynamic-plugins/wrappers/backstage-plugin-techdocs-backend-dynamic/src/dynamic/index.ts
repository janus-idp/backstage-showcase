import type { BackendDynamicPluginInstaller } from '@backstage/backend-dynamic-feature-service';
import { default as techdocsSearchModule } from '@backstage/plugin-search-backend-module-techdocs/alpha';
import { default as techdocsPlugin } from '@backstage/plugin-techdocs-backend/alpha';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',
  install: () => [techdocsPlugin(), techdocsSearchModule()],
};
