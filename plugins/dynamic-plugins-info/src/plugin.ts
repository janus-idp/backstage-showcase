import {
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { DynamicPluginsInfoClient } from './api/DynamicPluginsInfoClient';
import { dynamicPluginsInfoApiRef } from './api/types';
import { dynamicPluginsInfoRouteRef } from './routes';

export const dynamicPluginsInfoPlugin = createPlugin({
  id: 'dynamic-plugins-info',
  routes: {
    root: dynamicPluginsInfoRouteRef,
  },
  apis: [
    createApiFactory({
      api: dynamicPluginsInfoApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new DynamicPluginsInfoClient({ discoveryApi, fetchApi }),
    }),
  ],
});

export const DynamicPluginsInfo = dynamicPluginsInfoPlugin.provide(
  createRoutableExtension({
    name: 'DynamicPluginsInfo',
    component: () =>
      import(
        './components/DynamicPluginsInfoContent/DynamicPluginsInfoContent'
      ).then(m => m.DynamicPluginsInfoContent),
    mountPoint: dynamicPluginsInfoRouteRef,
  }),
);
