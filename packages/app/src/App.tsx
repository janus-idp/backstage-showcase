import { createApp } from '@backstage/app-defaults';
import { AppRouter, FlatRoutes } from '@backstage/core-app-api';
import {
  AlertDisplay,
  OAuthRequestDialog,
  ProxiedSignInPage,
  SignInPage,
} from '@backstage/core-components';
import { ApiExplorerPage, apiDocsPlugin } from '@backstage/plugin-api-docs';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  catalogPlugin,
} from '@backstage/plugin-catalog';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import { CatalogGraphPage } from '@backstage/plugin-catalog-graph';
import {
  CatalogImportPage,
  catalogImportPlugin,
} from '@backstage/plugin-catalog-import';
import { HomepageCompositionRoot } from '@backstage/plugin-home';
import { orgPlugin } from '@backstage/plugin-org';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { ScaffolderPage, scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { SearchPage as BackstageSearchPage } from '@backstage/plugin-search';
import { TechRadarPage } from '@backstage/plugin-tech-radar';
import {
  TechDocsIndexPage,
  TechDocsReaderPage,
  techdocsPlugin,
} from '@backstage/plugin-techdocs';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { UserSettingsPage } from '@backstage/plugin-user-settings';
import { UnifiedThemeProvider } from '@backstage/theme';
import LightIcon from '@mui/icons-material/WbSunny';
import DarkIcon from '@mui/icons-material/Brightness2';
import { OcmPage } from '@janus-idp/backstage-plugin-ocm';
import React from 'react';
import { Route } from 'react-router-dom';
import { apis } from './apis';
import { Root } from './components/Root';
import { entityPage } from './components/catalog/EntityPage';
import { HomePage } from './components/home/HomePage';
import { LearningPaths } from './components/learningPaths/LearningPathsPage';
import { SearchPage } from './components/search/SearchPage';
import { LighthousePage } from '@backstage/plugin-lighthouse';
import {
  configApiRef,
  githubAuthApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { customLightTheme } from './themes/lightTheme';
import { customDarkTheme } from './themes/darkTheme';
import { useUpdateTheme } from './hooks/useUpdateTheme';

const app = createApp({
  apis,
  bindRoutes({ bind }) {
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
  },
  themes: [
    {
      id: 'light',
      title: 'Light Theme',
      variant: 'light',
      icon: <LightIcon />,
      Provider: ({ children }) => {
        const themeColors = useUpdateTheme('light');
        return (
          <UnifiedThemeProvider
            theme={customLightTheme(themeColors)}
            children={children}
          />
        );
      },
    },
    {
      id: 'dark',
      title: 'Dark Theme',
      variant: 'dark',
      icon: <DarkIcon />,
      Provider: ({ children }) => {
        const themeColors = useUpdateTheme('dark');
        return (
          <UnifiedThemeProvider
            theme={customDarkTheme(themeColors)}
            children={children}
          />
        );
      },
    },
  ],
  components: {
    SignInPage: props => {
      const configApi = useApi(configApiRef);
      if (configApi.getString('auth.environment') === 'development') {
        return (
          <SignInPage
            {...props}
            title="Select a sign-in method"
            align="center"
            providers={[
              'guest',
              {
                id: 'github-auth-provider',
                title: 'GitHub',
                message: 'Sign in using GitHub',
                apiRef: githubAuthApiRef,
              },
            ]}
          />
        );
      }
      return <ProxiedSignInPage {...props} provider="oauth2Proxy" />;
    },
  },
});

// `routes` and every subsequent child needs to be static JSX, so the router can traverse the three without rendering.
// This is why we can't use a function component here.
const routes = (
  <FlatRoutes>
    <Route path="/" element={<HomepageCompositionRoot />}>
      <HomePage />
    </Route>
    <Route path="/catalog" element={<CatalogIndexPage />} />
    <Route
      path="/catalog/:namespace/:kind/:name"
      element={<CatalogEntityPage />}
    >
      {entityPage}
    </Route>
    <Route path="/docs" element={<TechDocsIndexPage />} />
    <Route
      path="/docs/:namespace/:kind/:name/*"
      element={<TechDocsReaderPage />}
    >
      <TechDocsAddons>
        <ReportIssue />
      </TechDocsAddons>
    </Route>
    <Route
      path="/create"
      element={
        <ScaffolderPage headerOptions={{ title: 'Golden Path Templates' }} />
      }
    />
    <Route path="/api-docs" element={<ApiExplorerPage />} />
    <Route
      path="/tech-radar"
      element={<TechRadarPage width={1500} height={800} id="default" />}
    />
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
    <Route path="/ocm" element={<OcmPage />} />
    <Route path="/learning-paths" element={<LearningPaths />} />
    <Route path="/lighthouse" element={<LighthousePage />} />
  </FlatRoutes>
);

export default app.createRoot(
  <>
    <AlertDisplay />
    <OAuthRequestDialog />
    <AppRouter>
      <Root>{routes}</Root>
    </AppRouter>
  </>,
);
