import { defaultConfigLoader } from '@backstage/core-app-api';
import { Entity } from '@backstage/catalog-model';
import { isKind } from '@backstage/plugin-catalog';
import { hasAnnotation, isType } from '../../components/catalog/utils';
import {
  DynamicModuleEntry,
  MenuItem,
  RouteBinding,
  ScalprumMountPointConfigRaw,
  ScalprumMountPointConfigRawIf,
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
  menuItem?: MenuItem;
  config?: {
    props?: Record<string, any>;
  };
};

type MountPoint = {
  scope: string;
  mountPoint: string;
  module: string;
  importName: string;
  config?: ScalprumMountPointConfigRaw;
};

type AppIcon = {
  scope: string;
  name: string;
  module: string;
  importName: string;
};

type BindingTarget = {
  scope: string;
  name: string;
  module: string;
  importName: string;
};

type ApiFactory = {
  scope: string;
  module: string;
  importName: string;
};

type CustomProperties = {
  dynamicRoutes?: (DynamicModuleEntry & {
    importName?: string;
    module?: string;
    path: string;
  })[];
  routeBindings?: {
    targets: BindingTarget[];
    bindings: RouteBinding[];
  };
  mountPoints?: MountPoint[];
  appIcons?: AppIcon[];
  apiFactories?: ApiFactory[];
};

export const conditionsArrayMapper = (
  condition:
    | {
        [key: string]: string | string[];
      }
    | Function,
) => {
  if (typeof condition === 'function') {
    return (entity: Entity) => Boolean(condition(entity));
  }
  if (condition.isKind) {
    return isKind(condition.isKind);
  }
  if (condition.isType) {
    return isType(condition.isType);
  }
  if (condition.hasAnnotation) {
    return hasAnnotation(condition.hasAnnotation as string);
  }
  return () => false;
};

export const configIfToCallable =
  (conditional: ScalprumMountPointConfigRawIf) => (e: Entity) => {
    if (conditional?.allOf) {
      return conditional.allOf.map(conditionsArrayMapper).every(f => f(e));
    }
    if (conditional?.anyOf) {
      return conditional.anyOf.map(conditionsArrayMapper).some(f => f(e));
    }
    if (conditional?.oneOf) {
      return (
        conditional.oneOf.map(conditionsArrayMapper).filter(f => f(e))
          .length === 1
      );
    }
    return true;
  };

/**
 * Converts all available configuration sources into the data structures
 * needed by the DynamicRoot component to wire the app together.  Accepts
 * an initial configuration for any statically linked frontend plugins that
 * need to display UI elements on dynamic frontend pages.
 *
 * @param frontendAppConfig
 */
async function extractDynamicConfig(
  frontendAppConfig: AppConfig = { context: '', data: {} },
) {
  const appConfigs = (await defaultConfigLoader()) || [];
  const initialDynamicConfig = appConfigsToDynamicConfig([frontendAppConfig]);
  const dynamicConfig = appConfigsToDynamicConfig(appConfigs, {
    routeBindings: initialDynamicConfig.routeBindings,
    dynamicRoutes: initialDynamicConfig.dynamicRoutes.filter(dynamicRoute =>
      doesConfigContain(dynamicRoute, 'dynamicRoutes', appConfigs),
    ),
    mountPoints: initialDynamicConfig.mountPoints.filter(mountPoint =>
      doesConfigContain(mountPoint, 'mountPoints', appConfigs),
    ),
    appIcons: initialDynamicConfig.appIcons,
    routeBindingTargets: initialDynamicConfig.routeBindingTargets,
    apiFactories: initialDynamicConfig.apiFactories,
  });
  return dynamicConfig;
}

/**
 * Converts an array of AppConfig objects to a dynamic frontend
 * configuration structure
 * @param appConfigs
 * @param initialDynamicConfig
 * @returns
 */
function appConfigsToDynamicConfig(
  appConfigs: AppConfig[],
  initialDynamicConfig: {
    routeBindings: RouteBinding[];
    routeBindingTargets: BindingTarget[];
    dynamicRoutes: DynamicRoute[];
    appIcons: AppIcon[];
    mountPoints: MountPoint[];
    apiFactories: ApiFactory[];
  } = {
    routeBindings: [],
    dynamicRoutes: [],
    mountPoints: [],
    appIcons: [],
    routeBindingTargets: [],
    apiFactories: [],
  },
) {
  return appConfigs.reduce<{
    routeBindings: RouteBinding[];
    routeBindingTargets: BindingTarget[];
    dynamicRoutes: DynamicRoute[];
    appIcons: AppIcon[];
    mountPoints: MountPoint[];
    apiFactories: ApiFactory[];
  }>((acc, { data }) => {
    if (data?.dynamicPlugins?.frontend) {
      acc.dynamicRoutes.push(
        ...Object.entries(data.dynamicPlugins.frontend).reduce<DynamicRoute[]>(
          (pluginSet, [scope, customProperties]) => {
            pluginSet.push(
              ...(customProperties.dynamicRoutes ?? []).map(route => ({
                ...route,
                module: route.module ?? 'PluginRoot',
                importName: route.importName ?? 'default',
                scope,
              })),
            );
            return pluginSet;
          },
          [],
        ),
      );
      acc.routeBindings.push(
        ...Object.entries(data.dynamicPlugins.frontend).reduce<RouteBinding[]>(
          (pluginSet, [_, customProperties]) => {
            pluginSet.push(...(customProperties.routeBindings?.bindings ?? []));
            return pluginSet;
          },
          [],
        ),
      );
      acc.routeBindingTargets.push(
        ...Object.entries(data.dynamicPlugins.frontend).reduce<BindingTarget[]>(
          (pluginSet, [scope, customProperties]) => {
            pluginSet.push(
              ...(customProperties.routeBindings?.targets ?? []).map(
                target => ({
                  ...target,
                  module: target.module ?? 'PluginRoot',
                  name: target.name ?? target.importName,
                  scope,
                }),
              ),
            );
            return pluginSet;
          },
          [],
        ),
      );

      acc.mountPoints.push(
        ...Object.entries(data.dynamicPlugins.frontend).reduce<MountPoint[]>(
          (accMountPoints, [scope, { mountPoints }]) => {
            accMountPoints.push(
              ...(mountPoints ?? []).map(point => ({
                ...point,
                module: point.module ?? 'PluginRoot',
                importName: point.importName ?? 'default',
                scope,
              })),
            );
            return accMountPoints;
          },
          [],
        ),
      );

      acc.appIcons.push(
        ...Object.entries(data.dynamicPlugins.frontend).reduce<AppIcon[]>(
          (accAppIcons, [scope, { appIcons }]) => {
            accAppIcons.push(
              ...(appIcons ?? []).map(icon => ({
                ...icon,
                module: icon.module ?? 'PluginRoot',
                importName: icon.importName ?? 'default',
                scope,
              })),
            );
            return accAppIcons;
          },
          [],
        ),
      );

      acc.apiFactories.push(
        ...Object.entries(data.dynamicPlugins.frontend).reduce<ApiFactory[]>(
          (accApiFactories, [scope, { apiFactories }]) => {
            accApiFactories.push(
              ...(apiFactories ?? []).map(api => ({
                module: api.module ?? 'PluginRoot',
                importName: api.importName ?? 'default',
                scope,
              })),
            );
            return accApiFactories;
          },
          [],
        ),
      );
    }
    return acc;
  }, initialDynamicConfig);
}

/**
 * Check the app config to see if the given entry has been configured in an
 * app-config.yaml file.  Used to override static plugin configuration.
 *
 * @param entry
 * @param attribute
 * @param appConfigs
 * @returns
 */
function doesConfigContain(
  entry: DynamicRoute | MountPoint,
  attribute: string,
  appConfigs: AppConfig[],
) {
  return appConfigs
    .map(
      (appConfig: AppConfig) => appConfig.data.dynamicPlugins?.frontend || {},
    )
    .filter(pluginConfig => {
      return Object.keys(pluginConfig).find(scope => scope === entry.scope);
    })
    .reduce((_acc, curr: any) => {
      return curr[entry.scope][attribute] === undefined;
    }, true);
}

export default extractDynamicConfig;
