import React, { useContext } from 'react';
import { Route } from 'react-router-dom';

import { FlatRoutes } from '@backstage/core-app-api';
import { AlertDisplay, OAuthRequestDialog } from '@backstage/core-components';
import { ApiExplorerPage } from '@backstage/plugin-api-docs';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  CatalogTable,
  CatalogTableColumnsFunc,
  CatalogTableRow,
} from '@backstage/plugin-catalog';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import { CatalogGraphPage } from '@backstage/plugin-catalog-graph';
import { CatalogImportPage } from '@backstage/plugin-catalog-import';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { ScaffolderPage } from '@backstage/plugin-scaffolder';
import { ScaffolderFieldExtensions } from '@backstage/plugin-scaffolder-react';
import { SearchPage as BackstageSearchPage } from '@backstage/plugin-search';
import { UserSettingsPage } from '@backstage/plugin-user-settings';

import ButtonV4 from '@material-ui/core/Button';
import GridV4 from '@material-ui/core/Grid';
import TextFieldV4 from '@material-ui/core/TextField';
import AutocompleteV4 from '@material-ui/lab/Autocomplete';
import AutocompleteV5 from '@mui/material/Autocomplete';
import ButtonV5 from '@mui/material/Button';
import GridV5 from '@mui/material/Grid';
import TextFieldV5 from '@mui/material/TextField';

import { entityPage } from '../catalog/EntityPage';
import DynamicRootContext from '../DynamicRoot/DynamicRootContext';
import { LearningPaths } from '../learningPaths/LearningPathsPage';
import { Root } from '../Root';
import ConfigUpdater from '../Root/ConfigUpdater';
import { SearchPage } from '../search/SearchPage';
import { settingsPage } from '../UserSettings/SettingsPages';

const ButtonTest = () => {
  const movies = [
    { title: 'The Shawshank Redemption', year: 1994 },
    { title: 'The Godfather', year: 1972 },
    { title: 'The Godfather: Part II', year: 1974 },
    { title: 'The Dark Knight', year: 2008 },
    { title: '12 Angry Men', year: 1957 },
    { title: "Schindler's List", year: 1993 },
    { title: 'Pulp Fiction', year: 1994 },
    { title: 'The Lord of the Rings: The Return of the King', year: 2003 },
    { title: 'The Good, the Bad and the Ugly', year: 1966 },
    { title: 'Fight Club', year: 1999 },
  ];

  return (
    <div>
      <h1>Material UI v4 buttons</h1>
      <div>
        <ButtonV4 variant="contained">Default</ButtonV4>
        <ButtonV4 variant="contained" color="primary">
          Primary
        </ButtonV4>
        <ButtonV4 variant="contained" color="secondary">
          Secondary
        </ButtonV4>
        <ButtonV4 variant="contained" disabled>
          Disabled
        </ButtonV4>
        <ButtonV4 variant="contained" color="primary" href="#contained-buttons">
          Link
        </ButtonV4>
      </div>

      <h1>MUI v5 buttons</h1>
      <div>
        <ButtonV5 variant="contained">Default</ButtonV5>
        <ButtonV5 variant="contained" color="primary">
          Primary
        </ButtonV5>
        <ButtonV5 variant="contained" color="secondary">
          Secondary
        </ButtonV5>
        <ButtonV5 variant="contained" disabled>
          Disabled
        </ButtonV5>
        <ButtonV5 variant="contained" color="primary" href="#contained-buttons">
          Link
        </ButtonV5>
      </div>

      <h1>Material UI v4 Autocomplete</h1>
      <div>
        <AutocompleteV4
          options={movies}
          renderInput={params => <TextFieldV4 {...params} label="Movie" />}
          getOptionLabel={option => option.title}
        />
      </div>

      <h1>MUI v5 Autocomplete</h1>
      <div>
        <AutocompleteV5
          options={movies}
          renderInput={params => <TextFieldV5 {...params} label="Movie" />}
          getOptionLabel={option => option.title}
        />
      </div>

      <h1>MUI v4 Grid</h1>
      <GridV4 container>
        <GridV4 item>
          <div style={{ backgroundColor: 'gray' }}>1</div>
        </GridV4>
        <GridV4 item>
          <div style={{ backgroundColor: 'gray' }}>2</div>
        </GridV4>
        <GridV4 item>
          <div style={{ backgroundColor: 'gray' }}>3</div>
        </GridV4>
        <GridV4 item>
          <div style={{ backgroundColor: 'gray' }}>4</div>
        </GridV4>
      </GridV4>

      <h1>MUI v5 Grid</h1>
      <GridV5 container>
        <GridV5 item>
          <div style={{ backgroundColor: 'gray' }}>1</div>
        </GridV5>
        <GridV5 item>
          <div style={{ backgroundColor: 'gray' }}>2</div>
        </GridV5>
        <GridV5 item>
          <div style={{ backgroundColor: 'gray' }}>3</div>
        </GridV5>
        <GridV5 item>
          <div style={{ backgroundColor: 'gray' }}>4</div>
        </GridV5>
      </GridV5>
    </div>
  );
};

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
        <ConfigUpdater />
        <Root>
          <FlatRoutes>
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
            <Route path="/button-test" element={<ButtonTest />} />
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
