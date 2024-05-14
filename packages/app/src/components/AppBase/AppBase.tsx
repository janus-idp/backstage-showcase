import { FlatRoutes } from '@backstage/core-app-api';
import { AlertDisplay, OAuthRequestDialog } from '@backstage/core-components';
import { ApiExplorerPage } from '@backstage/plugin-api-docs';
import { CatalogEntityPage, CatalogIndexPage } from '@backstage/plugin-catalog';
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

  const ifNotDynamic = (path: string, route: React.ReactElement) =>
    dynamicRoutes.filter(({ path: p }) => p === path).length === 0 && route;

  return (
    <AppProvider>
      <AlertDisplay />
      <OAuthRequestDialog />
      <AppRouter>
        <Root>
          <FlatRoutes>
            {ifNotDynamic(
              '/',
              <Route path="/" element={<HomepageCompositionRoot />}>
                <HomePage />
              </Route>,
            )}
            {ifNotDynamic(
              '/catalog',
              <Route
                path="/catalog"
                element={<CatalogIndexPage pagination />}
              />,
            )}
            {ifNotDynamic(
              '//catalog/:namespace/:kind/:name',
              <Route
                path="/catalog/:namespace/:kind/:name"
                element={<CatalogEntityPage />}
              >
                {entityPage(entityTabOverrides)}
              </Route>,
            )}
            {ifNotDynamic(
              '/create',
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
              </Route>,
            )}
            {ifNotDynamic(
              '/api-docs',
              <Route path="/api-docs" element={<ApiExplorerPage />} />,
            )}
            {ifNotDynamic(
              '/catalog-import',
              <Route
                path="/catalog-import"
                element={
                  <RequirePermission permission={catalogEntityCreatePermission}>
                    <CatalogImportPage />
                  </RequirePermission>
                }
              />,
            )}
            {ifNotDynamic(
              '/search',
              <Route path="/search" element={<BackstageSearchPage />}>
                <SearchPage />
              </Route>,
            )}
            {ifNotDynamic(
              '/settings',
              <Route path="/settings" element={<UserSettingsPage />}>
                {settingsPage}
              </Route>,
            )}
            {ifNotDynamic(
              '/catalog-graph',
              <Route path="/catalog-graph" element={<CatalogGraphPage />} />,
            )}
            {ifNotDynamic(
              '/learning-paths',
              <Route path="/learning-paths" element={<LearningPaths />} />,
            )}
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
