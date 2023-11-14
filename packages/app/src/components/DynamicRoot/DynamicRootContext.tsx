import React, { createContext } from 'react';

import { ScalprumComponentProps } from '@scalprum/react-core';
import { Entity } from '@backstage/catalog-model';
import { BackstagePlugin } from '@backstage/core-plugin-api';

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

type ScalprumMountPointConfigBase = {
  layout?: Record<string, string>;
  props?: Record<string, any>;
};

export type ScalprumMountPointConfig = ScalprumMountPointConfigBase & {
  if: (e: Entity) => boolean | Promise<boolean>;
};

export type ScalprumMountPointConfigRawIf = {
  [key in 'allOf' | 'oneOf' | 'anyOf']?: (
    | {
        [key: string]: string | string[];
      }
    | Function
  )[];
};

export type ScalprumMountPointConfigRaw = ScalprumMountPointConfigBase & {
  if?: ScalprumMountPointConfigRawIf;
};

export type ScalprumMountPoint = {
  Component: React.ComponentType<{}>;
  config?: ScalprumMountPointConfig;
};

export type RemotePlugins = {
  [scope: string]: {
    [module: string]: {
      [importName: string]:
        | React.ComponentType<{}>
        | ((...args: any[]) => any)
        | BackstagePlugin<{}>;
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
