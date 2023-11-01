/* eslint-disable @typescript-eslint/no-shadow */
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { createApp } from '@backstage/app-defaults';
import {
  BackstageApp,
  ConfigReader,
  defaultConfigLoader,
} from '@backstage/core-app-api';
import { AnyApiFactory } from '@backstage/core-plugin-api';

import { AppsConfig, getScalprum } from '@scalprum/core';
import { ScalprumProvider, useScalprum } from '@scalprum/react-core';

import DynamicRootContext, {
  DynamicRootContextValue,
  ScalprumMountPoint,
} from './DynamicRootContext';
import extractDynamicConfig from '../../utils/dynamicUI/extractDynamicConfig';
import initializeRemotePlugins from '../../utils/dynamicUI/initializeRemotePlugins';
import defaultThemes from './defaultThemes';
import defaultAppComponents from './defaultAppComponents';
import bindAppRoutes from '../../utils/dynamicUI/bindAppRoutes';
import overrideBaseUrlConfigs from '../../utils/dynamicUI/overrideBaseUrlConfigs';
import useAsync from 'react-use/lib/useAsync';

const DynamicRoot = ({
  afterInit,
  apis,
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
  // console.log({ DEFAULT_PROXY_PATH })

  // Fills registry of remote components
  const initializeRemoteModules = useCallback(async () => {
    const { dynamicRoutes, mountPoints, routeBindings } =
      await extractDynamicConfig();

    const requiredModules = [
      ...mountPoints.map(({ module, scope }) => ({
        scope,
        module,
      })),
      ...dynamicRoutes.map(({ scope, module }) => ({
        scope,
        module,
      })),
    ];

    const remotePlugins = await initializeRemotePlugins(
      pluginStore,
      scalprumConfig,
      requiredModules,
    );

    if (!app.current) {
      app.current = createApp({
        apis,
        bindRoutes({ bind }) {
          bindAppRoutes(bind, remotePlugins, routeBindings);
        },
        themes: defaultThemes,
        components: defaultAppComponents,
      });
    }

    const providerMountPoints = mountPoints.map(
      ({ module, importName, mountPoint, scope }) => ({
        mountPoint,
        Component: remotePlugins[scope][module][importName],
      }),
    );

    const mountPointComponents = providerMountPoints.reduce<{
      [mountPoint: string]: ScalprumMountPoint[];
    }>((acc, entry) => {
      if (!acc[entry.mountPoint]) {
        acc[entry.mountPoint] = [];
      }
      acc[entry.mountPoint].push(entry.Component);
      return acc;
    }, {});
    getScalprum().api.mountPoints = mountPointComponents;
    const dynamicRoutesComponents = dynamicRoutes.map(route => ({
      ...route,
      Component: remotePlugins[route.scope][route.module][route.importName],
    }));
    setComponents({
      AppProvider: app.current.getProvider(),
      AppRouter: app.current.getRouter(),
      dynamicRoutes: dynamicRoutesComponents,
      mountPoints: mountPointComponents,
    });
    afterInit().then(({ default: Component }) => {
      setChildComponent(() => Component);
    });
  }, [pluginStore, scalprumConfig, apis, afterInit]);

  useEffect(() => {
    if (initialized && !components) {
      initializeRemoteModules();
    }
  }, [initialized, components, initializeRemoteModules]);

  if (!initialized || !components) {
    return null;
  }

  return (
    <DynamicRootContext.Provider value={components}>
      {ChildComponent ? <ChildComponent /> : <div>Loading</div>}
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
  const { loading, error, value } = useAsync(async () => {
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

  if (loading || !value?.scalprumConfig) {
    return null;
  }

  if (error) {
    return <div>Error</div>;
  }

  return (
    <ScalprumProvider
      config={value.scalprumConfig}
      pluginSDKOptions={{
        pluginLoaderOptions: {
          postProcessManifest: manifest => {
            return {
              ...manifest,
              loadScripts: manifest.loadScripts.map(
                script =>
                  `${value.baseUrl}/api/scalprum/${manifest.name}/${script}`,
              ),
            };
          },
        },
      }}
    >
      <DynamicRoot
        afterInit={afterInit}
        scalprumConfig={value.scalprumConfig}
        apis={apis}
      />
    </ScalprumProvider>
  );
};

export default ScalprumRoot;
