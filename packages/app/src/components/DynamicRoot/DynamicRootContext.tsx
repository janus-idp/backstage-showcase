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

export type ResolvedMenuItem =
  | {
      text: string;
      icon: string;
    }
  | {
      Component: React.ComponentType<any>;
      config: {
        props?: Record<string, any>;
      };
    };

export type DynamicModuleEntry = Pick<
  ScalprumComponentProps,
  'scope' | 'module'
>;

export type ResolvedDynamicRoute = DynamicModuleEntry & {
  path: string;
  menuItem?: ResolvedMenuItem;
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
  if: (e: Entity) => boolean;
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

export type EntityTabOverrides = Record<
  string,
  { title: string; mountPoint: string }
>;

export type MountPoints = Record<string, ScalprumMountPoint[]>;

export type ScaffolderFieldExtension = {
  scope: string;
  module: string;
  importName: string;
  Component: React.ComponentType<{}>;
};

export type DynamicRootConfig = {
  dynamicRoutes: ResolvedDynamicRoute[];
  entityTabOverrides: EntityTabOverrides;
  mountPoints: MountPoints;
  scaffolderFieldExtensions: ScaffolderFieldExtension[];
};

export type ComponentRegistry = {
  AppProvider: React.ComponentType<React.PropsWithChildren>;
  AppRouter: React.ComponentType<React.PropsWithChildren>;
} & DynamicRootConfig;

const DynamicRootContext = createContext<ComponentRegistry>({
  AppProvider: () => null,
  AppRouter: () => null,
  dynamicRoutes: [],
  entityTabOverrides: {},
  mountPoints: {},
  scaffolderFieldExtensions: [],
});

export default DynamicRootContext;
