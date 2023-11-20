/* eslint-disable @typescript-eslint/no-shadow */
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { createApp } from '@backstage/app-defaults';
import {
  BackstageApp,
  ConfigReader,
  defaultConfigLoader,
} from '@backstage/core-app-api';
import { AnyApiFactory, BackstagePlugin } from '@backstage/core-plugin-api';

import { AppsConfig, getScalprum } from '@scalprum/core';
import { ScalprumProvider, useScalprum } from '@scalprum/react-core';

import DynamicRootContext, {
  DynamicRootContextValue,
  ScalprumMountPoint,
  ScalprumMountPointConfig,
} from './DynamicRootContext';
import extractDynamicConfig, {
  configIfToCallable,
} from '../../utils/dynamicUI/extractDynamicConfig';
import initializeRemotePlugins from '../../utils/dynamicUI/initializeRemotePlugins';
import defaultThemes from './defaultThemes';
import defaultAppComponents from './defaultAppComponents';
import bindAppRoutes from '../../utils/dynamicUI/bindAppRoutes';
import overrideBaseUrlConfigs from '../../utils/dynamicUI/overrideBaseUrlConfigs';
import useAsync from 'react-use/lib/useAsync';
import Loader from './Loader';

const DynamicRoot = ({
  afterInit,
  apis: staticApis,
  scalprumConfig,
}: {
  // Static APIs
  apis: AnyApiFactory[];
  scalprumConfig: AppsConfig;
  afterInit: () => Promise<{ default: React.ComponentType }>;
}) => {
  const app = useRef<BackstageApp>();
  const [ChildComponent, setChildComponent] = useState<
    React.ComponentType | undefined
  >(undefined);
  // registry of remote components loaded at bootstrap
  const [components, setComponents] = useState<
    | {
        AppProvider: React.ComponentType;
        AppRouter: React.ComponentType;
        dynamicRoutes: DynamicRootContextValue[];
        mountPoints: { [mountPoint: string]: ScalprumMountPoint[] };
      }
    | undefined
  >();
  const { initialized, pluginStore } = useScalprum();

  // Fills registry of remote components
  const initializeRemoteModules = useCallback(async () => {
    const {
      dynamicRoutes,
      mountPoints,
      routeBindings,
      appIcons,
      routeBindingTargets,
      apiFactories,
    } = await extractDynamicConfig();

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

    const remotePlugins = await initializeRemotePlugins(
      pluginStore,
      scalprumConfig,
      requiredModules,
    );
    const resolvedRouteBindingTargets = Object.fromEntries(
      routeBindingTargets.reduce<[string, BackstagePlugin<{}>][]>(
        (acc, { name, importName, scope, module }) => {
          const plugin = remotePlugins[scope]?.[module]?.[importName];

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
          const Component = remotePlugins[scope]?.[module]?.[importName];

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
        const apiFactory = remotePlugins[scope]?.[module]?.[importName];

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

    if (!app.current) {
      app.current = createApp({
        apis: [...staticApis, ...remoteApis],
        bindRoutes({ bind }) {
          bindAppRoutes(bind, resolvedRouteBindingTargets, routeBindings);
        },
        icons,
        themes: defaultThemes,
        components: defaultAppComponents,
      });
    }

    const providerMountPoints = mountPoints.reduce<
      {
        mountPoint: string;
        Component: React.ComponentType<{}>;
        config?: ScalprumMountPointConfig;
        staticJSXContent?: React.ReactNode;
      }[]
    >((acc, { module, importName, mountPoint, scope, config }) => {
      const Component = remotePlugins[scope]?.[module]?.[importName];
      // Only add mount points that have a component
      if (Component) {
        const ifCondition = configIfToCallable(
          Object.fromEntries(
            Object.entries(config?.if || {}).map(([k, v]) => [
              k,
              v.map(c => {
                if (typeof c === 'string') {
                  const remoteFunc = remotePlugins[scope]?.[module]?.[c];
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
        remotePlugins[route.scope]?.[route.module]?.[route.importName];
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

    setComponents({
      AppProvider: app.current.getProvider(),
      AppRouter: app.current.getRouter(),
      dynamicRoutes: dynamicRoutesComponents,
      mountPoints: mountPointComponents,
    });

    afterInit().then(({ default: Component }) => {
      setChildComponent(() => Component);
    });
  }, [pluginStore, scalprumConfig, staticApis, afterInit]);

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

const ScalprumRoot = ({
  apis,
  afterInit,
}: {
  // Static APIs
  apis: AnyApiFactory[];
  afterInit: () => Promise<{ default: React.ComponentType }>;
}) => {
  const { loading, value } = useAsync(async () => {
    const config = ConfigReader.fromConfigs(
      overrideBaseUrlConfigs(await defaultConfigLoader()),
    );

    const baseUrl = config.get('backend.baseUrl');
    const scalprumConfig: AppsConfig = await fetch(
      `${baseUrl}/api/scalprum/plugins`,
    ).then(r => r.json());
    return {
      baseUrl,
      scalprumConfig,
    };
  });

  if (loading) {
    return <Loader />;
  }

  return (
    <ScalprumProvider
      config={value?.scalprumConfig ?? {}}
      pluginSDKOptions={{
        pluginLoaderOptions: {
          postProcessManifest: manifest => {
            return {
              ...manifest,
              loadScripts: manifest.loadScripts.map(
                script =>
                  `${value?.baseUrl ?? ''}/api/scalprum/${
                    manifest.name
                  }/${script}`,
              ),
            };
          },
        },
      }}
    >
      <DynamicRoot
        afterInit={afterInit}
        scalprumConfig={value?.scalprumConfig ?? {}}
        apis={apis}
      />
    </ScalprumProvider>
  );
};

export default ScalprumRoot;
