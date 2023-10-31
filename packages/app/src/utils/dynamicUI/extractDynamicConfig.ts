import { defaultConfigLoader } from '@backstage/core-app-api';
import {
  DynamicModuleEntry,
  RouteBinding,
} from '../../components/DynamicRoot/DynamicRootContext';

type AppConfig = {
  context: string;
  data: {
    dynamicPlugins?: {
      frontend?: {
        [key: string]: CustomProperties;
      };
    };
  };
};

type DynamicRoute = {
  scope: string;
  module: string;
  importName: string;
  path: string;
};

export type MountPoint = {
  mountPoint: string;
  module: string;
  importName?: string;
};

type CustomProperties = {
  dynamicRoutes?: (DynamicModuleEntry & {
    importName: string;
    path: string;
  })[];
  routeBindings?: RouteBinding[];
  mountPoints?: MountPoint[];
};

async function extractDynamicConfig() {
  // Extract routes lists and app bindings from the app config file
  const appsConfig = await defaultConfigLoader();
  const dynamicConfig = (appsConfig as AppConfig[]).reduce<{
    routeBindings: RouteBinding[];
    dynamicRoutes: DynamicRoute[];
    mountPoints: {
      scope: string;
      module: string;
      importName: string;
      mountPoint: string;
    }[];
  }>(
    (acc, { data }) => {
      if (data?.dynamicPlugins?.frontend) {
        acc.dynamicRoutes.push(
          ...Object.entries(data.dynamicPlugins.frontend).reduce<
            DynamicRoute[]
          >((pluginSet, [scope, customProperties]) => {
            pluginSet.push(
              ...(customProperties.dynamicRoutes ?? []).map(route => ({
                ...route,
                scope,
              })),
            );
            return pluginSet;
          }, []),
        );
        acc.routeBindings.push(
          ...Object.entries(data.dynamicPlugins.frontend).reduce<
            RouteBinding[]
          >((pluginSet, [_, customProperties]) => {
            pluginSet.push(...(customProperties.routeBindings ?? []));
            return pluginSet;
          }, []),
        );

        acc.mountPoints.push(
          ...Object.entries(data.dynamicPlugins.frontend).reduce<
            {
              scope: string;
              module: string;
              importName: string;
              mountPoint: string;
            }[]
          >((accMountPoints, [scope, { mountPoints }]) => {
            accMountPoints.push(
              ...(mountPoints ?? []).map(point => ({
                ...point,
                importName: point.importName ?? 'default',
                scope,
              })),
            );
            return accMountPoints;
          }, []),
        );
      }
      return acc;
    },
    { routeBindings: [], dynamicRoutes: [], mountPoints: [] },
  ) || { routeBindings: [], dynamicRoutes: [], mountPoints: [] }; // fallback to empty arrays

  return dynamicConfig;
}

export default extractDynamicConfig;
