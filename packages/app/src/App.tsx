import React from 'react';
import { apis } from './apis';
import DynamicRoot from './components/DynamicRoot';

// Statically integrated frontend plugins
const { dynamicPluginsInfoPlugin, ...dynamicPluginsInfoPluginModule } =
  await import('@internal/plugin-dynamic-plugins-info');

// The base UI configuration, these values can be overridden by values
// specified in external configuration files
const baseFrontendConfig = {
  context: 'frontend',
  data: {
    dynamicPlugins: {
      frontend: {
        '@internal/plugin-dynamic-plugins-info': {
          dynamicRoutes: [
            { path: '/admin/plugins', importName: 'DynamicPluginsInfo' },
          ],
          mountPoints: [
            {
              mountPoint: 'admin.page.plugins/cards',
              importName: 'DynamicPluginsInfo',
              config: {
                layout: {
                  gridColumn: '1 / -1',
                  width: '100vw',
                },
              },
            },
          ],
        },
      },
    },
  },
};

// The map of static plugins by package name
const staticPluginMap = {
  '@internal/plugin-dynamic-plugins-info': {
    plugin: dynamicPluginsInfoPlugin,
    module: dynamicPluginsInfoPluginModule,
  },
};

const AppRoot = () => (
  <DynamicRoot
    apis={apis}
    afterInit={() => import('./components/AppBase')}
    baseFrontendConfig={baseFrontendConfig}
    plugins={staticPluginMap}
  />
);

export default AppRoot;
