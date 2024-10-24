import React from 'react';

import {
  configApiRef,
  createApiFactory,
  createComponentExtension,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import type {
  FeaturedDocsCardProps,
  StarredEntitiesProps,
  VisitedByTypeProps,
} from '@backstage/plugin-home';

import { QuickAccessApiClient, quickAccessApiRef } from './api';
import { rootRouteRef } from './routes';

export const dynamicHomePagePlugin = createPlugin({
  id: 'dynamic-home-page',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: quickAccessApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        configApi: configApiRef,
        identityApi: identityApiRef,
      },
      factory: ({ discoveryApi, configApi, identityApi }) =>
        new QuickAccessApiClient({ discoveryApi, configApi, identityApi }),
    }),
  ],
});

export const DynamicHomePage = dynamicHomePagePlugin.provide(
  createRoutableExtension({
    name: 'DynamicHomePage',
    component: () =>
      import('./components/DynamicHomePage').then(m => m.DynamicHomePage),
    mountPoint: rootRouteRef,
  }),
);

export const SearchBar = dynamicHomePagePlugin.provide(
  createComponentExtension({
    name: 'SearchBar',
    component: {
      lazy: () => import('./components/SearchBar').then(m => m.SearchBar),
    },
  }),
);

export const QuickAccessCard = dynamicHomePagePlugin.provide(
  createComponentExtension({
    name: 'QuickAccessCard',
    component: {
      lazy: () =>
        import('./components/QuickAccessCard').then(m => m.QuickAccessCard),
    },
  }),
);

export const Headline = dynamicHomePagePlugin.provide(
  createComponentExtension({
    name: 'Headline',
    component: {
      lazy: () => import('./components/Headline').then(m => m.Headline),
    },
  }),
);

export const Markdown = dynamicHomePagePlugin.provide(
  createComponentExtension({
    name: 'Markdown',
    component: {
      lazy: () => import('./components/Markdown').then(m => m.Markdown),
    },
  }),
);

export const MarkdownCard = dynamicHomePagePlugin.provide(
  createComponentExtension({
    name: 'MarkdownCard',
    component: {
      lazy: () => import('./components/MarkdownCard').then(m => m.MarkdownCard),
    },
  }),
);

export const Placeholder = dynamicHomePagePlugin.provide(
  createComponentExtension({
    name: 'MarkdownCard',
    component: {
      lazy: () => import('./components/Placeholder').then(m => m.Placeholder),
    },
  }),
);

export const CatalogStarredEntitiesCard: React.ComponentType<StarredEntitiesProps> =
  dynamicHomePagePlugin.provide(
    createComponentExtension({
      name: 'CatalogStarredEntitiesCard',
      component: {
        lazy: () =>
          import('@backstage/plugin-home').then(m => m.HomePageStarredEntities),
      },
    }),
  );

export const RecentlyVisitedCard: React.ComponentType<VisitedByTypeProps> =
  dynamicHomePagePlugin.provide(
    createComponentExtension({
      name: 'RecentlyVisitedCard',
      component: {
        lazy: () =>
          import('@backstage/plugin-home').then(m => m.HomePageRecentlyVisited),
      },
    }),
  );

export const TopVisitedCard: React.ComponentType<VisitedByTypeProps> =
  dynamicHomePagePlugin.provide(
    createComponentExtension({
      name: 'TopVisitedCard',
      component: {
        lazy: () =>
          import('@backstage/plugin-home').then(m => m.HomePageTopVisited),
      },
    }),
  );

export const FeaturedDocsCard: React.ComponentType<FeaturedDocsCardProps> =
  dynamicHomePagePlugin.provide(
    createComponentExtension({
      name: 'FeaturedDocsCard',
      component: {
        lazy: () =>
          import('@backstage/plugin-home').then(m => m.FeaturedDocsCard),
      },
    }),
  );

export const JokeCard: React.ComponentType<{
  defaultCategory?: 'any' | 'programming';
}> = dynamicHomePagePlugin.provide(
  createComponentExtension({
    name: 'JokeCard',
    component: {
      lazy: () =>
        import('@backstage/plugin-home').then(m => m.HomePageRandomJoke),
    },
  }),
);
