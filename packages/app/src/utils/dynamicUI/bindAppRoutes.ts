import { AppRouteBinder } from '@backstage/core-app-api';
import { apiDocsPlugin } from '@backstage/plugin-api-docs';
import { catalogPlugin } from '@backstage/plugin-catalog';
import { catalogImportPlugin } from '@backstage/plugin-catalog-import';
import { orgPlugin } from '@backstage/plugin-org';
import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { techdocsPlugin } from '@backstage/plugin-techdocs';
import get from 'lodash/get';
import {
  RemotePlugins,
  RouteBinding,
} from '../../components/DynamicRoot/DynamicRootContext';

const bindAppRoutes = (
  bind: AppRouteBinder,
  remotePlugins: RemotePlugins,
  routeBindings: RouteBinding[],
) => {
  // Static bindings
  bind(catalogPlugin.externalRoutes, {
    createComponent: scaffolderPlugin.routes.root,
    viewTechDoc: techdocsPlugin.routes.docRoot,
    createFromTemplate: scaffolderPlugin.routes.selectedTemplate,
  });
  bind(apiDocsPlugin.externalRoutes, {
    registerApi: catalogImportPlugin.routes.importPage,
  });
  bind(scaffolderPlugin.externalRoutes, {
    registerComponent: catalogImportPlugin.routes.importPage,
    viewTechDoc: techdocsPlugin.routes.docRoot,
  });
  bind(orgPlugin.externalRoutes, {
    catalogIndex: catalogPlugin.routes.catalogIndex,
  });

  const availableBindPlugins = {
    remotePlugins,
    catalogPlugin,
    catalogImportPlugin,
    techdocsPlugin,
  };
  // binds from remote
  routeBindings.forEach(({ bindTarget, bindMap }) => {
    bind(
      get(availableBindPlugins, bindTarget),
      Object.entries(bindMap).reduce<{ [key: string]: any }>(
        (acc, [key, value]) => {
          acc[key] = get(availableBindPlugins, value);
          return acc;
        },
        {},
      ) as any,
    );
  });
};

export default bindAppRoutes;
