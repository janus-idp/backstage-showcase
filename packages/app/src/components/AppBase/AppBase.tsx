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
import { SearchPage as BackstageSearchPage } from '@backstage/plugin-search';
import { UserSettingsPage } from '@backstage/plugin-user-settings';
import React, { useContext } from 'react';
import { Route } from 'react-router-dom';
import { Root } from '../Root';
import { entityPage } from '../catalog/EntityPage';
import { HomePage } from '../home/HomePage';
import { LearningPaths } from '../learningPaths/LearningPathsPage';
import { SearchPage } from '../search/SearchPage';
import DynamicRootContext from '../DynamicRoot/DynamicRootContext';

const AppBase = () => {
  const { AppProvider, AppRouter, dynamicRoutes } =
    useContext(DynamicRootContext);
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
            <Route path="/catalog" element={<CatalogIndexPage />} />
            <Route
              path="/catalog/:namespace/:kind/:name"
              element={<CatalogEntityPage />}
            >
              {entityPage}
            </Route>
            <Route
              path="/create"
              element={
                <ScaffolderPage
                  headerOptions={{ title: 'Golden Path Templates' }}
                />
              }
            />
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
            <Route path="/settings" element={<UserSettingsPage />} />
            <Route path="/catalog-graph" element={<CatalogGraphPage />} />
            <Route path="/learning-paths" element={<LearningPaths />} />
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
