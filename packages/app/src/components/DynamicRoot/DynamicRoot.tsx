/* eslint-disable @typescript-eslint/no-shadow */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createApp } from '@backstage/app-defaults';
import { BackstageApp } from '@backstage/core-app-api';
import { AnyApiFactory, BackstagePlugin } from '@backstage/core-plugin-api';

import { useThemes } from '@redhat-developer/red-hat-developer-hub-theme';
import { AppsConfig, getScalprum } from '@scalprum/core';
import { useScalprum } from '@scalprum/react-core';
import DynamicRootContext, {
  ComponentRegistry,
  DynamicRootContextValue,
  RemotePlugins,
  ScalprumMountPoint,
  ScalprumMountPointConfig,
} from './DynamicRootContext';
import extractDynamicConfig, {
  configIfToCallable,
} from '../../utils/dynamicUI/extractDynamicConfig';
import initializeRemotePlugins from '../../utils/dynamicUI/initializeRemotePlugins';
import defaultAppComponents from './defaultAppComponents';
import bindAppRoutes from '../../utils/dynamicUI/bindAppRoutes';
import Loader from './Loader';
import { AppConfig } from '@backstage/config';

export type StaticPlugins = Record<
  string,
  {
    plugin: BackstagePlugin;
    module:
      | React.ComponentType<{}>
      | { [importName: string]: React.ComponentType<{}> };
  }
>;

type EntityTabMap = Record<string, { title: string; mountPoint: string }>;

export const DynamicRoot = ({
  afterInit,
  apis: staticApis,
  appConfig,
  baseFrontendConfig,
  staticPluginStore = {},
  scalprumConfig,
}: {
  afterInit: () => Promise<{ default: React.ComponentType }>;
  // Static APIs
  apis: AnyApiFactory[];
  appConfig: AppConfig[];
  baseFrontendConfig: AppConfig;
  staticPluginStore?: StaticPlugins;
  scalprumConfig: AppsConfig;
}) => {
  const app = useRef<BackstageApp>();
  const [ChildComponent, setChildComponent] = useState<
    React.ComponentType | undefined
  >(undefined);
  // registry of remote components loaded at bootstrap
  const [components, setComponents] = useState<ComponentRegistry | undefined>();
  const { initialized, pluginStore } = useScalprum();

  const themes = useThemes();

  // Fills registry of remote components
  const initializeRemoteModules = useCallback(async () => {
    const {
      apiFactories,
      appIcons,
      dynamicRoutes,
      entityTabs,
      mountPoints,
      routeBindings,
      routeBindingTargets,
    } = await extractDynamicConfig({
      frontendAppConfig: baseFrontendConfig,
      appConfig,
    });

    const requiredModules = [
      ...routeBindingTargets.map(({ scope, module }) => ({
        scope,
        module,
      })),
      ...mountPoints.map(({ module, scope }) => ({
        scope,
        module,
      })),
      ...dynamicRoutes.map(({ scope, module }) => ({
        scope,
        module,
      })),
      ...appIcons.map(({ scope, module }) => ({
        scope,
        module,
      })),
      ...apiFactories.map(({ scope, module }) => ({
        scope,
        module,
      })),
    ];

    const staticPlugins = Object.keys(staticPluginStore).reduce(
      (acc, pluginKey) => {
        return {
          ...acc,
          [pluginKey]: { PluginRoot: staticPluginStore[pluginKey].module },
        };
      },
      {},
    ) as RemotePlugins;
    const remotePlugins = await initializeRemotePlugins(
      pluginStore,
      scalprumConfig,
      requiredModules,
    );
    const allPlugins = { ...staticPlugins, ...remotePlugins };
    const resolvedRouteBindingTargets = Object.fromEntries(
      routeBindingTargets.reduce<[string, BackstagePlugin<{}>][]>(
        (acc, { name, importName, scope, module }) => {
          const plugin = allPlugins[scope]?.[module]?.[importName];

          if (plugin) {
            acc.push([name, plugin as BackstagePlugin<{}>]);
          } else {
            // eslint-disable-next-line no-console
            console.warn(
              `Plugin ${scope} is not configured properly: ${module}.${importName} not found, ignoring routeBindings target: ${name}`,
            );
          }
          return acc;
        },
        [],
      ),
    );

    const icons = Object.fromEntries(
      appIcons.reduce<[string, React.ComponentType<{}>][]>(
        (acc, { scope, module, importName, name }) => {
          const Component = allPlugins[scope]?.[module]?.[importName];

          if (Component) {
            acc.push([name, Component as React.ComponentType<{}>]);
          } else {
            // eslint-disable-next-line no-console
            console.warn(
              `Plugin ${scope} is not configured properly: ${module}.${importName} not found, ignoring appIcon: ${name}`,
            );
          }
          return acc;
        },
        [],
      ),
    );

    const remoteApis = apiFactories.reduce<AnyApiFactory[]>(
      (acc, { scope, module, importName }) => {
        const apiFactory = allPlugins[scope]?.[module]?.[importName];

        if (apiFactory) {
          acc.push(apiFactory as AnyApiFactory);
        } else {
          // eslint-disable-next-line no-console
          console.warn(
            `Plugin ${scope} is not configured properly: ${module}.${importName} not found, ignoring apiFactory: ${importName}`,
          );
        }
        return acc;
      },
      [],
    );

    const providerMountPoints = mountPoints.reduce<
      {
        mountPoint: string;
        Component: React.ComponentType<{}>;
        config?: ScalprumMountPointConfig;
        staticJSXContent?: React.ReactNode;
      }[]
    >((acc, { module, importName, mountPoint, scope, config }) => {
      const Component = allPlugins[scope]?.[module]?.[importName];
      // Only add mount points that have a component
      if (Component) {
        const ifCondition = configIfToCallable(
          Object.fromEntries(
            Object.entries(config?.if || {}).map(([k, v]) => [
              k,
              v.map(c => {
                if (typeof c === 'string') {
                  const remoteFunc = allPlugins[scope]?.[module]?.[c];
                  if (remoteFunc === undefined) {
                    // eslint-disable-next-line no-console
                    console.warn(
                      `Plugin ${scope} is not configured properly: ${module}.${c} not found, ignoring .config.if for mountPoint: "${mountPoint}"`,
                    );
                  }
                  return remoteFunc || {};
                }
                return c || {};
              }),
            ]),
          ),
        );

        acc.push({
          mountPoint,
          Component:
            typeof Component === 'object' && 'element' in Component
              ? (Component.element as React.ComponentType<{}>)
              : (Component as React.ComponentType<{}>),
          staticJSXContent:
            typeof Component === 'object' && 'staticJSXContent' in Component
              ? (Component.staticJSXContent as React.ReactNode)
              : null,
          config: {
            ...config,
            if: ifCondition,
          },
        });
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          `Plugin ${scope} is not configured properly: ${module}.${importName} not found, ignoring mountPoint: "${mountPoint}"`,
        );
      }
      return acc;
    }, []);

    const mountPointComponents = providerMountPoints.reduce<{
      [mountPoint: string]: ScalprumMountPoint[];
    }>((acc, entry) => {
      if (!acc[entry.mountPoint]) {
        acc[entry.mountPoint] = [];
      }
      acc[entry.mountPoint].push({
        Component: entry.Component,
        staticJSXContent: entry.staticJSXContent,
        config: entry.config,
      });
      return acc;
    }, {});

    getScalprum().api.mountPoints = mountPointComponents;

    const dynamicRoutesComponents = dynamicRoutes.reduce<
      DynamicRootContextValue[]
    >((acc, route) => {
      const Component =
        allPlugins[route.scope]?.[route.module]?.[route.importName];
      if (Component) {
        acc.push({
          ...route,
          Component:
            typeof Component === 'object' && 'element' in Component
              ? (Component.element as React.ComponentType<{}>)
              : (Component as React.ComponentType<{}>),
          staticJSXContent:
            typeof Component === 'object' && 'staticJSXContent' in Component
              ? (Component.staticJSXContent as React.ReactNode)
              : null,
          config: route.config ?? {},
        });
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          `Plugin ${route.scope} is not configured properly: ${route.module}.${route.importName} not found, ignoring dynamicRoute: "${route.path}"`,
        );
      }
      return acc;
    }, []);

    const entityTabOverrides: EntityTabMap = entityTabs.reduce(
      (acc: EntityTabMap, { path, title, mountPoint, scope }) => {
        if (acc[path]) {
          // eslint-disable-next-line no-console
          console.warn(
            `Plugin ${scope} is not configured properly: a tab has already been configured for "${path}", ignoring entry with title: "${title}" and mountPoint: "${mountPoint}"`,
          );
        } else {
          acc[path] = { title, mountPoint };
        }
        return acc;
      },
      {} as EntityTabMap,
    );
    if (!app.current) {
      const fullConfig = [baseFrontendConfig, ...appConfig];
      app.current = createApp({
        apis: [...staticApis, ...remoteApis],
        bindRoutes({ bind }) {
          bindAppRoutes(bind, resolvedRouteBindingTargets, routeBindings);
        },
        icons,
        plugins: Object.values(staticPluginStore).map(entry => entry.plugin),
        themes,
        components: defaultAppComponents,
        configLoader: async () => Promise.resolve(fullConfig),
      });
    }

    setComponents({
      AppProvider: app.current.getProvider(),
      AppRouter: app.current.getRouter(),
      dynamicRoutes: dynamicRoutesComponents,
      mountPoints: mountPointComponents,
      entityTabOverrides,
    });

    afterInit().then(({ default: Component }) => {
      setChildComponent(() => Component);
    });
  }, [
    afterInit,
    appConfig,
    baseFrontendConfig,
    pluginStore,
    scalprumConfig,
    staticApis,
    staticPluginStore,
    themes,
  ]);

  useEffect(() => {
    if (initialized && !components) {
      initializeRemoteModules();
    }
  }, [initialized, components, initializeRemoteModules]);

  if (!initialized || !components) {
    return <Loader />;
  }

  return (
    <DynamicRootContext.Provider value={components}>
      {ChildComponent ? <ChildComponent /> : <Loader />}
    </DynamicRootContext.Provider>
  );
};

export default DynamicRoot;
