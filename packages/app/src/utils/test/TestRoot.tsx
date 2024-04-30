import React, { PropsWithChildren, useRef } from 'react';

import { createApp } from '@backstage/app-defaults';
import { BackstageApp } from '@backstage/core-app-api';
import { apiDocsPlugin } from '@backstage/plugin-api-docs';
import { catalogPlugin } from '@backstage/plugin-catalog';
import { catalogImportPlugin } from '@backstage/plugin-catalog-import';
import { orgPlugin } from '@backstage/plugin-org';

import { apis } from '../../apis';
import DynamicRootContext from '../../components/DynamicRoot/DynamicRootContext';
import { scaffolderPlugin } from '@backstage/plugin-scaffolder';

const TestRoot = ({ children }: PropsWithChildren<{}>) => {
  const { current } = useRef<BackstageApp>(
    createApp({
      apis,
      bindRoutes: ({ bind }) => {
        // Static bindings
        bind(catalogPlugin.externalRoutes, {
          createComponent: scaffolderPlugin.routes.root,
          createFromTemplate: scaffolderPlugin.routes.selectedTemplate,
        });
        bind(apiDocsPlugin.externalRoutes, {
          registerApi: catalogImportPlugin.routes.importPage,
        });
        bind(scaffolderPlugin.externalRoutes, {
          registerComponent: catalogImportPlugin.routes.importPage,
        });
        bind(orgPlugin.externalRoutes, {
          catalogIndex: catalogPlugin.routes.catalogIndex,
        });
      },
    }),
  );
  return (
    <DynamicRootContext.Provider
      value={{
        AppProvider: current.getProvider(),
        AppRouter: current.getRouter(),
        dynamicRoutes: [],
        mountPoints: {},
        entityTabOverrides: {},
      }}
    >
      {children}
    </DynamicRootContext.Provider>
  );
};

export default TestRoot;
