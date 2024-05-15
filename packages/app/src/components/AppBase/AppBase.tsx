import { FlatRoutes } from '@backstage/core-app-api';
import { AlertDisplay, OAuthRequestDialog } from '@backstage/core-components';
import { ApiExplorerPage } from '@backstage/plugin-api-docs';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  CatalogTable,
  CatalogTableRow,
  CatalogTableColumnsFunc,
} from '@backstage/plugin-catalog';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import { CatalogGraphPage } from '@backstage/plugin-catalog-graph';
import { CatalogImportPage } from '@backstage/plugin-catalog-import';
import { HomepageCompositionRoot } from '@backstage/plugin-home';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { ScaffolderPage } from '@backstage/plugin-scaffolder';
import { ScaffolderFieldExtensions } from '@backstage/plugin-scaffolder-react';
import { SearchPage as BackstageSearchPage } from '@backstage/plugin-search';
import { UserSettingsPage } from '@backstage/plugin-user-settings';
import React, { useContext } from 'react';
import { Route } from 'react-router-dom';
import DynamicRootContext from '../DynamicRoot/DynamicRootContext';
import { Root } from '../Root';
import { settingsPage } from '../UserSettings/SettingsPages';
import { AdminPage } from '../admin/AdminPage';
import { entityPage } from '../catalog/EntityPage';
import { HomePage } from '../home/HomePage';
import { LearningPaths } from '../learningPaths/LearningPathsPage';
import { SearchPage } from '../search/SearchPage';

const AppBase = () => {
  const {
    AppProvider,
    AppRouter,
    dynamicRoutes,
    entityTabOverrides,
    scaffolderFieldExtensions,
  } = useContext(DynamicRootContext);

  const myCustomColumnsFunc: CatalogTableColumnsFunc = entityListContext => [
    ...CatalogTable.defaultColumnsFunc(entityListContext),
    {
      title: 'Created At',
      customSort: (a: CatalogTableRow, b: CatalogTableRow): any => {
        const timestampA =
          a.entity.metadata.annotations?.['backstage.io/createdAt'];
        const timestampB =
          b.entity.metadata.annotations?.['backstage.io/createdAt'];

        const dateA =
          timestampA && timestampA !== ''
            ? new Date(timestampA).toISOString()
            : '';
        const dateB =
          timestampB && timestampB !== ''
            ? new Date(timestampB).toISOString()
            : '';

        return dateA.localeCompare(dateB);
      },
      render: (data: CatalogTableRow) => {
        const date =
          data.entity.metadata.annotations?.['backstage.io/createdAt'];
        return !isNaN(new Date(date || '') as any)
          ? data.entity.metadata.annotations?.['backstage.io/createdAt']
          : '';
      },
    },
  ];

  return (
    <AppProvider>
      <AlertDisplay />
      <OAuthRequestDialog />
      <AppRouter>
        <Root>
          <FlatRoutes>
            {dynamicRoutes.filter(({ path }) => path === '/').length === 0 && (
              <Route path="/" element={<HomepageCompositionRoot />}>
                <HomePage />
              </Route>
            )}
            <Route
              path="/catalog"
              element={
                <CatalogIndexPage pagination columns={myCustomColumnsFunc} />
              }
            />
            <Route
              path="/catalog/:namespace/:kind/:name"
              element={<CatalogEntityPage />}
            >
              {entityPage(entityTabOverrides)}
            </Route>
            <Route
              path="/create"
              element={
                <ScaffolderPage
                  headerOptions={{ title: 'Software Templates' }}
                />
              }
            >
              <ScaffolderFieldExtensions>
                {scaffolderFieldExtensions.map(
                  ({ scope, module, importName, Component }) => (
                    <Component key={`${scope}-${module}-${importName}`} />
                  ),
                )}
              </ScaffolderFieldExtensions>
              scaffolderFieldExtensions
            </Route>
            <Route path="/api-docs" element={<ApiExplorerPage />} />
            <Route
              path="/catalog-import"
              element={
                <RequirePermission permission={catalogEntityCreatePermission}>
                  <CatalogImportPage />
                </RequirePermission>
              }
            />
            <Route path="/search" element={<BackstageSearchPage />}>
              <SearchPage />
            </Route>
            <Route path="/settings" element={<UserSettingsPage />}>
              {settingsPage}
            </Route>
            <Route path="/catalog-graph" element={<CatalogGraphPage />} />
            <Route path="/learning-paths" element={<LearningPaths />} />
            <Route path="/admin" element={<AdminPage />} />
            {dynamicRoutes
              .filter(({ path }) => path.startsWith('/admin'))
              .map(({ path }) => (
                <Route
                  key={`admin-path-${path}`}
                  path={path}
                  element={<AdminPage />}
                />
              ))}
            {dynamicRoutes.map(
              ({ Component, staticJSXContent, path, config: { props } }) => (
                <Route
                  key={path}
                  path={path}
                  element={<Component {...props} />}
                >
                  {staticJSXContent}
                </Route>
              ),
            )}
          </FlatRoutes>
        </Root>
      </AppRouter>
    </AppProvider>
  );
};

export default AppBase;
