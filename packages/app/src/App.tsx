import React from 'react';
import { apis } from './apis';
import DynamicRoot from './components/DynamicRoot';
import { DefaultMainMenuItems } from './consts';

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
        'default.main-menu-items': DefaultMainMenuItems,
        '@internal/plugin-dynamic-plugins-info': {
          appIcons: [
            { name: 'pluginsInfoIcon', importName: 'PluginsInfoIcon' },
            { name: 'adminIcon', importName: 'AdminIcon' },
          ],
          dynamicRoutes: [
            {
              path: '/plugins',
              importName: 'DynamicPluginsInfo',
              menuItem: { text: 'Plugins', icon: 'pluginsInfoIcon' },
            },
          ],
          menuItems: {
            admin: {
              title: 'Administration',
              icon: 'adminIcon',
            },
            plugins: {
              parent: 'admin',
              title: 'Plugins',
              icon: 'pluginsInfoIcon',
            },
          },
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
