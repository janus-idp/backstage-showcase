import React, { createContext } from 'react';

import { Entity } from '@backstage/catalog-model';
import { AnyApiFactory, BackstagePlugin } from '@backstage/core-plugin-api';
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
  staticJSXContent?: React.ReactNode;
  config: {
    props?: Record<string, any>;
  };
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
  Component: React.ComponentType<React.PropsWithChildren>;
  config?: ScalprumMountPointConfig;
  staticJSXContent?: React.ReactNode;
};

export type RemotePlugins = {
  [scope: string]: {
    [module: string]: {
      [importName: string]:
        | React.ComponentType<React.PropsWithChildren>
        | ((...args: any[]) => any)
        | BackstagePlugin<{}>
        | {
            element: React.ComponentType<React.PropsWithChildren>;
            staticJSXContent: React.ReactNode;
          }
        | AnyApiFactory;
    };
  };
};

export type ComponentRegistry = {
  AppProvider: React.ComponentType<React.PropsWithChildren>;
  AppRouter: React.ComponentType<React.PropsWithChildren>;
  dynamicRoutes: DynamicRootContextValue[];
  mountPoints: { [mountPoint: string]: ScalprumMountPoint[] };
  entityTabOverrides: Record<string, { title: string; mountPoint: string }>;
};

const DynamicRootContext = createContext<ComponentRegistry>({
  AppProvider: () => null,
  AppRouter: () => null,
  dynamicRoutes: [],
  mountPoints: {},
  entityTabOverrides: {},
});

export default DynamicRootContext;
