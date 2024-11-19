import { createDevApp, DevAppPageOptions } from '@backstage/dev-utils';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  EntityLayout,
} from '@backstage/plugin-catalog';
import {
  CatalogApi,
  catalogApiRef,
  EntityProvider,
  MockStarredEntitiesApi,
  starredEntitiesApiRef,
} from '@backstage/plugin-catalog-react';
import {
  Visit,
  VisitsApi,
  VisitsApiQueryParams,
  visitsApiRef,
} from '@backstage/plugin-home';
import { MockSearchApi, searchApiRef } from '@backstage/plugin-search-react';
import { TestApiProvider } from '@backstage/test-utils';

import { PluginStore } from '@openshift/dynamic-plugin-sdk';
import { getAllThemes } from '@redhat-developer/red-hat-developer-hub-theme';
import { ScalprumContext, ScalprumState } from '@scalprum/react-core';

import { QuickAccessApi, quickAccessApiRef } from '../src/api';
import {
  CatalogStarredEntitiesCard,
  DynamicHomePage,
  dynamicHomePagePlugin,
  FeaturedDocsCard,
  Headline,
  JokeCard,
  Markdown,
  MarkdownCard,
  Placeholder,
  QuickAccessCard,
  RecentlyVisitedCard,
  SearchBar,
  TopVisitedCard,
} from '../src/plugin';
import { HomePageCardMountPoint, QuickAccessLink } from '../src/types';
import defaultQuickAccess from './quickaccess-default.json';

const defaultMountPoints: HomePageCardMountPoint[] = [
  {
    Component: SearchBar,
    config: {
      // prettier-ignore
      layouts: {
        xl:  { w: 10, h: 1, x: 1 },
        lg:  { w: 10, h: 1, x: 1 },
        md:  { w: 10, h: 1, x: 1 },
        sm:  { w: 10, h: 1, x: 1 },
        xs:  { w: 12, h: 1 },
        xxs: { w: 12, h: 1 },
      },
    },
  },
  {
    Component: QuickAccessCard as React.ComponentType,
    config: {
      // prettier-ignore
      layouts: {
        xl:  { w:  7, h: 8 },
        lg:  { w:  7, h: 8 },
        md:  { w:  7, h: 8 },
        sm:  { w: 12, h: 8 },
        xs:  { w: 12, h: 8 },
        xxs: { w: 12, h: 8 },
      },
    },
  },
  {
    Component: CatalogStarredEntitiesCard,
    config: {
      // prettier-ignore
      layouts: {
        xl:  { w:  5, h: 4, x: 7 },
        lg:  { w:  5, h: 4, x: 7 },
        md:  { w:  5, h: 4, x: 7 },
        sm:  { w: 12, h: 4 },
        xs:  { w: 12, h: 4 },
        xxs: { w: 12, h: 4 },
      },
    },
  },
];

class MockQuickAccessApi implements QuickAccessApi {
  async getQuickAccessLinks(): Promise<QuickAccessLink[]> {
    return defaultQuickAccess as QuickAccessLink[];
  }
}

const entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'random-component',
  },
};

const entities /* : Entity[]*/ = [
  {
    apiVersion: '1',
    kind: 'Component',
    metadata: {
      name: 'service-a',
    },
  },
  {
    apiVersion: '1',
    kind: 'Component',
    metadata: {
      name: 'service-b',
    },
  },
];

const mockCatalogApi: Partial<CatalogApi> = {
  // getEntities: (request?: GetEntitiesRequest, options?: CatalogRequestOptions): Promise<GetEntitiesResponse>
  getEntities: async () => ({
    items: entities,
  }),
  // getEntitiesByRefs(request: GetEntitiesByRefsRequest, options?: CatalogRequestOptions): Promise<GetEntitiesByRefsResponse>
  getEntitiesByRefs: async () => ({
    items: entities,
  }),
};

const mockStarredEntitiesApi = new MockStarredEntitiesApi();
mockStarredEntitiesApi.toggleStarred('service-a');
mockStarredEntitiesApi.toggleStarred('service-b');

class MockVisitsApi implements VisitsApi {
  async list(queryParams?: VisitsApiQueryParams): Promise<Visit[]> {
    const links = [
      'example-app',
      'another-app',
      'service-a',
      'service-b',
      'service-c',
      'short',
      'long-application-name',
    ];
    const visits = links.map(link => ({
      id: link,
      name: link,
      pathname: link,
      hits: link.length,
      timestamp: Date.now() - link.length * 1000 * 60,
    }));
    if (
      queryParams?.orderBy?.[0]?.field === 'timestamp' &&
      queryParams.orderBy[0].direction === 'desc'
    ) {
      visits.sort((a, b) => b.timestamp - a.timestamp);
    }
    if (
      queryParams?.orderBy?.[0]?.field === 'hits' &&
      queryParams.orderBy[0].direction === 'desc'
    ) {
      visits.sort((a, b) => b.hits - a.hits);
    }
    return visits;
  }

  async save(): Promise<Visit> {
    throw new Error('MockVisitsApi save not implemented.');
  }
}

const createPage = ({
  navTitle,
  pageTitle,
  pageWidth,
  mountPoints,
}: {
  navTitle: string;
  pageTitle?: string;
  pageWidth?: number;
  mountPoints?: HomePageCardMountPoint[];
}): DevAppPageOptions => {
  const backstageApis = [
    [searchApiRef, new MockSearchApi()],
    [quickAccessApiRef, new MockQuickAccessApi()],
    [catalogApiRef, mockCatalogApi],
    [starredEntitiesApiRef, mockStarredEntitiesApi],
    [visitsApiRef, new MockVisitsApi()],
  ] as const;

  const scalprumState: ScalprumState = {
    initialized: true,
    api: mountPoints
      ? {
          dynamicRootConfig: {
            mountPoints: {
              'home.page/cards': mountPoints,
            },
          },
        }
      : undefined,
    config: {},
    pluginStore: new PluginStore(),
  };

  const pageContent = (
    <TestApiProvider apis={backstageApis}>
      <ScalprumContext.Provider value={scalprumState}>
        <div style={{ width: pageWidth }}>
          <DynamicHomePage title={pageTitle} />
        </div>
      </ScalprumContext.Provider>
    </TestApiProvider>
  );

  return {
    element: pageContent,
    title: navTitle,
    path: navTitle.toLowerCase().replaceAll(/[^a-z0-9]/g, '-'),
  };
};

createDevApp()
  .registerPlugin(dynamicHomePagePlugin)
  .addThemes(getAllThemes())
  .addPage({
    path: '/catalog',
    title: 'Catalog',
    element: <CatalogIndexPage />,
  })
  .addPage({
    path: '/catalog/:namespace/:kind/:name',
    element: <CatalogEntityPage />,
    children: (
      <EntityProvider entity={entity}>
        <EntityLayout>
          <EntityLayout.Route path="/" title="Overview">
            <h1>Overview</h1>
          </EntityLayout.Route>
        </EntityLayout>
      </EntityProvider>
    ),
  })
  .addPage(
    createPage({
      navTitle: 'Default',
      mountPoints: defaultMountPoints,
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Default small',
      pageWidth: 600,
      mountPoints: defaultMountPoints,
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Default medium',
      pageWidth: 1200,
      mountPoints: defaultMountPoints,
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Default large',
      pageWidth: 1600,
      mountPoints: defaultMountPoints,
    }),
  )
  .addPage(
    createPage({
      navTitle: 'No configuration',
      pageTitle: 'No configuration (mountpoints not defined)',
      mountPoints: undefined,
    }),
  )
  .addPage(
    createPage({
      navTitle: 'No cards',
      pageTitle: 'No cards (empty mountpoint array)',
      mountPoints: [],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'SearchBar',
      pageTitle: 'SearchBar',
      mountPoints: [
        {
          Component: SearchBar as React.ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 2, h: 1 },
              lg:  { w: 2, h: 1 },
              md:  { w: 2, h: 1 },
              sm:  { w: 2, h: 1 },
              xs:  { w: 2, h: 1 },
              xxs: { w: 2, h: 1 },
            },
            props: {
              path: '/searchbar',
            },
          },
        },
        {
          Component: SearchBar as React.ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 6, h: 1 },
              lg:  { w: 6, h: 1 },
              md:  { w: 6, h: 1 },
              sm:  { w: 6, h: 1 },
              xs:  { w: 6, h: 1 },
              xxs: { w: 6, h: 1 },
            },
            props: {
              path: '/searchbar',
            },
          },
        },
        {
          Component: SearchBar as React.ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 12, h: 1 },
              lg:  { w: 12, h: 1 },
              md:  { w: 12, h: 1 },
              sm:  { w: 12, h: 1 },
              xs:  { w: 12, h: 1 },
              xxs: { w: 12, h: 1 },
            },
            props: {
              path: '/searchbar',
            },
          },
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'QuickAccess',
      pageTitle: 'QuickAccessCard',
      mountPoints: [
        {
          Component: QuickAccessCard as React.ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w:  6, h: 8 },
              lg:  { w:  6, h: 8 },
              md:  { w:  6, h: 8 },
              sm:  { w: 12, h: 8 },
              xs:  { w: 12, h: 8 },
              xxs: { w: 12, h: 8 },
            },
          },
        },
        {
          Component: QuickAccessCard as React.ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w:  6, h: 8, x: 6 },
              lg:  { w:  6, h: 8, x: 6 },
              md:  { w:  6, h: 8, x: 6 },
              sm:  { w: 12, h: 8, x: 6 },
              xs:  { w: 12, h: 8, x: 6 },
              xxs: { w: 12, h: 8, x: 6 },
            },
          },
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Headline',
      pageTitle: 'Headline',
      mountPoints: [
        {
          Component: Headline as React.ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 12, h: 1 },
              lg:  { w: 12, h: 1 },
              md:  { w: 12, h: 1 },
              sm:  { w: 12, h: 1 },
              xs:  { w: 12, h: 1 },
              xxs: { w: 12, h: 1 },
            },
            props: {
              title: 'A headline',
            },
          },
        },
        {
          Component: Headline as React.ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 12, h: 1 },
              lg:  { w: 12, h: 1 },
              md:  { w: 12, h: 1 },
              sm:  { w: 12, h: 1 },
              xs:  { w: 12, h: 1 },
              xxs: { w: 12, h: 1 },
            },
            props: {
              title: 'A centered headline',
              align: 'center',
            },
          },
        },
        {
          Component: Headline as React.ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 12, h: 1 },
              lg:  { w: 12, h: 1 },
              md:  { w: 12, h: 1 },
              sm:  { w: 12, h: 1 },
              xs:  { w: 12, h: 1 },
              xxs: { w: 12, h: 1 },
            },
            props: {
              title: 'A right-aligned headline',
              align: 'right',
            },
          },
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'MarkdownCard',
      pageTitle: 'MarkdownCard',
      mountPoints: [
        {
          Component: MarkdownCard as React.ComponentType,
          config: {
            props: {
              title: 'Markdown example',
              content:
                '# Headline 1\n## Headline 2\n### Headline 3\n\nSome content',
            },
          },
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Markdown',
      pageTitle: 'Markdown',
      mountPoints: [
        {
          Component: Markdown as React.ComponentType,
          config: {
            props: {
              title: 'Markdown example',
              content:
                '# Headline 1\n## Headline 2\n### Headline 3\n\nSome content',
            },
          },
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Placeholder',
      pageTitle: 'Placeholder',
      mountPoints: [
        {
          Component: Placeholder as React.ComponentType,
          config: {
            props: {
              showBorder: true,
            },
          },
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'CatalogStarred',
      pageTitle: 'CatalogStarredEntitiesCard',
      mountPoints: [
        {
          Component: CatalogStarredEntitiesCard,
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'FeaturedDocs',
      pageTitle: 'FeaturedDocsCard',
      mountPoints: [
        {
          Component: FeaturedDocsCard as React.ComponentType,
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'RecentlyVisitedCard',
      pageTitle: 'RecentlyVisitedCard',
      mountPoints: [
        {
          Component: RecentlyVisitedCard as React.ComponentType,
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'TopVisitedCard',
      pageTitle: 'TopVisitedCard',
      mountPoints: [
        {
          Component: TopVisitedCard as React.ComponentType,
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'JokeCard',
      pageTitle: 'JokeCard',
      mountPoints: [
        {
          Component: JokeCard,
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Layout test 1',
      pageTitle: 'Layout test 1',
      mountPoints: [
        {
          Component: Placeholder as React.ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 1, h: 1 },
              lg:  { w: 1, h: 1 },
              md:  { w: 1, h: 1 },
              sm:  { w: 1, h: 1 },
              xs:  { w: 1, h: 1 },
              xxs: { w: 1, h: 1 },
            },
            props: {
              debugContent: '1 (no x)',
              showBorder: true,
            },
          },
        },
        {
          Component: Placeholder as React.ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 1, h: 1 },
              lg:  { w: 1, h: 1 },
              md:  { w: 1, h: 1 },
              sm:  { w: 1, h: 1 },
              xs:  { w: 1, h: 1 },
              xxs: { w: 1, h: 1 },
            },
            props: {
              debugContent: '2 (no x)',
              showBorder: true,
            },
          },
        },
        {
          Component: Placeholder as React.ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 1, h: 1 },
              lg:  { w: 1, h: 1 },
              md:  { w: 1, h: 1 },
              sm:  { w: 1, h: 1 },
              xs:  { w: 1, h: 1 },
              xxs: { w: 1, h: 1 },
            },
            props: {
              debugContent: '3 (no x)',
              showBorder: true,
            },
          },
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Layout test 2',
      pageTitle: 'Layout test 2',
      mountPoints: [
        {
          Component: Placeholder as React.ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 1, h: 1 },
              lg:  { w: 1, h: 1 },
              md:  { w: 1, h: 1 },
              sm:  { w: 1, h: 1 },
              xs:  { w: 1, h: 1 },
              xxs: { w: 1, h: 1 },
            },
            props: {
              debugContent: '1 (no x)',
              showBorder: true,
            },
          },
        },
        {
          Component: Placeholder as React.ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 1, h: 1, x: 1 },
              lg:  { w: 1, h: 1, x: 1 },
              md:  { w: 1, h: 1, x: 1 },
              sm:  { w: 1, h: 1, x: 1 },
              xs:  { w: 1, h: 1, x: 1 },
              xxs: { w: 1, h: 1, x: 1 },
            },
            props: {
              debugContent: '2 (x=1)',
              showBorder: true,
            },
          },
        },
        {
          Component: Placeholder as React.ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 1, h: 1, x: 2 },
              lg:  { w: 1, h: 1, x: 2 },
              md:  { w: 1, h: 1, x: 2 },
              sm:  { w: 1, h: 1, x: 2 },
              xs:  { w: 1, h: 1, x: 2 },
              xxs: { w: 1, h: 1, x: 2 },
            },
            props: {
              debugContent: '3 (x=1)',
              showBorder: true,
            },
          },
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Layout test 3',
      pageTitle: 'Layout test 3',
      mountPoints: [
        {
          Component: Placeholder as React.ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 1, h: 1, x: 1, y: 1 },
              lg:  { w: 1, h: 1, x: 1, y: 1 },
              md:  { w: 1, h: 1, x: 1, y: 1 },
              sm:  { w: 1, h: 1, x: 1, y: 1 },
              xs:  { w: 1, h: 1, x: 1, y: 1 },
              xxs: { w: 1, h: 1, x: 1, y: 1 },
            },
            props: {
              debugContent: '1 (1,1)',
              showBorder: true,
            },
          },
        },
        {
          Component: Placeholder as React.ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 1, h: 1, x: 2, y: 2 },
              lg:  { w: 1, h: 1, x: 2, y: 2 },
              md:  { w: 1, h: 1, x: 2, y: 2 },
              sm:  { w: 1, h: 1, x: 2, y: 2 },
              xs:  { w: 1, h: 1, x: 2, y: 2 },
              xxs: { w: 1, h: 1, x: 2, y: 2 },
            },
            props: {
              debugContent: '2 (2,2)',
              showBorder: true,
            },
          },
        },
        {
          Component: Placeholder as React.ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 2, h: 2 },
              lg:  { w: 2, h: 2 },
              md:  { w: 2, h: 2 },
              sm:  { w: 2, h: 2 },
              xs:  { w: 2, h: 2 },
              xxs: { w: 2, h: 2 },
            },
            props: {
              debugContent: '3 (w=2, h=2, no x and y)',
              showBorder: true,
            },
          },
        },
      ],
    }),
  )
  .render();
