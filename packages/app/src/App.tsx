import { apis } from './apis';
import { StaticPlugins } from './components/DynamicRoot/DynamicRoot';
import ScalprumRoot from './components/DynamicRoot/ScalprumRoot';
import { DefaultMainMenuItems } from './consts';

// Statically integrated frontend plugins
const { dynamicPluginsInfoPlugin, ...dynamicPluginsInfoPluginModule } =
  await import('@internal/plugin-dynamic-plugins-info');

const { dynamicHomePagePlugin, ...dynamicHomePagePluginModule } = await import(
  '@internal/backstage-plugin-dynamic-home-page'
);

// The base UI configuration, these values can be overridden by values
// specified in external configuration files
const baseFrontendConfig = {
  context: 'frontend',
  data: {
    dynamicPlugins: {
      frontend: {
        'default.main-menu-items': DefaultMainMenuItems,
        // please keep this in sync with plugins/dynamic-plugins-info/app-config.janus-idp.yaml
        'internal.plugin-dynamic-plugins-info': {
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
        // please keep this in sync with plugins/dynamic-home-page/app-config.janus-idp.yaml
        'janus-idp.backstage-plugin-dynamic-home-page': {
          dynamicRoutes: [
            {
              path: '/',
              importName: 'DynamicHomePage',
            },
          ],
          mountPoints: [
            {
              mountPoint: 'home.page/cards',
              importName: 'SearchBar',
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
              mountPoint: 'home.page/cards',
              importName: 'QuickAccessCard',
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
              mountPoint: 'home.page/cards',
              importName: 'CatalogStarredEntitiesCard',
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
          ],
        },
      },
    },
  },
};

// The map of static plugins by package name
const staticPlugins: StaticPlugins = {
  'internal.plugin-dynamic-plugins-info': {
    plugin: dynamicPluginsInfoPlugin,
    module: dynamicPluginsInfoPluginModule,
  },
  'janus-idp.backstage-plugin-dynamic-home-page': {
    plugin: dynamicHomePagePlugin,
    module: dynamicHomePagePluginModule,
  },
};

const AppRoot = () => (
  <ScalprumRoot
    apis={apis}
    afterInit={() => import('./components/AppBase')}
    baseFrontendConfig={baseFrontendConfig}
    plugins={staticPlugins}
  />
);

export default AppRoot;
