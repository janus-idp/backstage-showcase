import React, { createContext } from 'react';

import { ScalprumComponentProps } from '@scalprum/react-core';

export type RouteBinding = {
  bindTarget: string;
  bindMap: {
    [target: string]: string;
  };
};

export type MenuItem = {
  text: string;
  icon: string;
};

export type DynamicModuleEntry = Pick<
  ScalprumComponentProps,
  'scope' | 'module'
>;
export type DynamicRootContextValue = DynamicModuleEntry & {
  path: string;
  menuItem?: MenuItem;
  Component: React.ComponentType<any>;
};

export type ScalprumMountPoint = React.ComponentType<{}>;

export type RemotePlugins = {
  [scope: string]: {
    [module: string]: {
      [importName: string]: React.ComponentType<{}>;
    };
  };
};

const DynamicRootContext = createContext<{
  AppProvider: React.ComponentType;
  AppRouter: React.ComponentType;
  dynamicRoutes: DynamicRootContextValue[];
  mountPoints: {
    [mountPoint: string]: ScalprumMountPoint[];
  };
}>({
  AppProvider: () => null,
  AppRouter: () => null,
  dynamicRoutes: [],
  mountPoints: {},
});

export default DynamicRootContext;
