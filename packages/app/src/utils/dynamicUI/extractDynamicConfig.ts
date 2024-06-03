import { Entity } from '@backstage/catalog-model';
import { isKind } from '@backstage/plugin-catalog';
import { hasAnnotation, isType } from '../../components/catalog/utils';
import {
  DynamicModuleEntry,
  RouteBinding,
  ScalprumMountPointConfigRaw,
  ScalprumMountPointConfigRawIf,
} from '../../components/DynamicRoot/DynamicRootContext';
import { ApiHolder } from '@backstage/core-plugin-api';

export type MenuItem =
  | {
      text: string;
      icon: string;
    }
  | {
      module?: string;
      importName: string;
      config?: {
        props?: Record<string, any>;
      };
    };

export type DynamicRoute = {
  scope: string;
  module: string;
  importName: string;
  path: string;
  menuItem?: MenuItem;
  config?: {
    props?: Record<string, any>;
  };
};

type PluginModule = {
  scope: string;
  module: string;
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

type ScaffolderFieldExtension = {
  scope: string;
  module: string;
  importName: string;
};

type EntityTab = {
  mountPoint: string;
  path: string;
  title: string;
};

type EntityTabEntry = {
  scope: string;
  mountPoint: string;
  path: string;
  title: string;
};

type CustomProperties = {
  pluginModule?: string;
  dynamicRoutes?: (DynamicModuleEntry & {
    importName?: string;
    module?: string;
    path: string;
  })[];
  routeBindings?: {
    targets: BindingTarget[];
    bindings: RouteBinding[];
  };
  entityTabs?: EntityTab[];
  mountPoints?: MountPoint[];
  appIcons?: AppIcon[];
  apiFactories?: ApiFactory[];
  scaffolderFieldExtensions?: ScaffolderFieldExtension[];
};

type FrontendConfig = {
  [key: string]: CustomProperties;
};

export type DynamicPluginConfig = {
  frontend?: FrontendConfig;
};

type DynamicConfig = {
  pluginModules: PluginModule[];
  apiFactories: ApiFactory[];
  appIcons: AppIcon[];
  dynamicRoutes: DynamicRoute[];
  entityTabs: EntityTabEntry[];
  mountPoints: MountPoint[];
  routeBindings: RouteBinding[];
  routeBindingTargets: BindingTarget[];
  scaffolderFieldExtensions: ScaffolderFieldExtension[];
};

/**
 * Converts the dynamic plugin configuration structure to the data structure
 * required by the dynamic UI, substituting in any defaults as needed
 */
function extractDynamicConfig(
  dynamicPlugins: DynamicPluginConfig = { frontend: {} },
) {
  const frontend = dynamicPlugins.frontend || {};
  const config: DynamicConfig = {
    pluginModules: [],
    apiFactories: [],
    appIcons: [],
    dynamicRoutes: [],
    entityTabs: [],
    mountPoints: [],
    routeBindings: [],
    routeBindingTargets: [],
    scaffolderFieldExtensions: [],
  };
  config.pluginModules = Object.entries(frontend).reduce<PluginModule[]>(
    (pluginSet, [scope, customProperties]) => {
      pluginSet.push({
        scope,
        module: customProperties.pluginModule ?? 'PluginRoot',
      });
      return pluginSet;
    },
    [],
  );
  config.dynamicRoutes = Object.entries(frontend).reduce<DynamicRoute[]>(
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
  );
  config.routeBindings = Object.entries(frontend).reduce<RouteBinding[]>(
    (pluginSet, [_, customProperties]) => {
      pluginSet.push(...(customProperties.routeBindings?.bindings ?? []));
      return pluginSet;
    },
    [],
  );
  config.routeBindingTargets = Object.entries(frontend).reduce<BindingTarget[]>(
    (pluginSet, [scope, customProperties]) => {
      pluginSet.push(
        ...(customProperties.routeBindings?.targets ?? []).map(target => ({
          ...target,
          module: target.module ?? 'PluginRoot',
          name: target.name ?? target.importName,
          scope,
        })),
      );
      return pluginSet;
    },
    [],
  );
  config.mountPoints = Object.entries(frontend).reduce<MountPoint[]>(
    (accMountPoints, [scope, { mountPoints }]) => {
      accMountPoints.push(
        ...(mountPoints ?? []).map(mountPoint => ({
          ...mountPoint,
          module: mountPoint.module ?? 'PluginRoot',
          importName: mountPoint.importName ?? 'default',
          scope,
        })),
      );
      return accMountPoints;
    },
    [],
  );
  config.appIcons = Object.entries(frontend).reduce<AppIcon[]>(
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
  );
  config.apiFactories = Object.entries(frontend).reduce<ApiFactory[]>(
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
  );
  config.scaffolderFieldExtensions = Object.entries(frontend).reduce<
    ScaffolderFieldExtension[]
  >((accScaffolderFieldExtensions, [scope, { scaffolderFieldExtensions }]) => {
    accScaffolderFieldExtensions.push(
      ...(scaffolderFieldExtensions ?? []).map(scaffolderFieldExtension => ({
        module: scaffolderFieldExtension.module ?? 'PluginRoot',
        importName: scaffolderFieldExtension.importName ?? 'default',
        scope,
      })),
    );
    return accScaffolderFieldExtensions;
  }, []);
  config.entityTabs = Object.entries(frontend).reduce<EntityTabEntry[]>(
    (accEntityTabs, [scope, { entityTabs }]) => {
      accEntityTabs.push(
        ...(entityTabs ?? []).map(entityTab => ({
          ...entityTab,
          scope,
        })),
      );
      return accEntityTabs;
    },
    [],
  );
  return config;
}

/**
 * Evaluate the supplied conditional map.  Used to determine the visibility of
 * tabs in the UI
 * @param conditional
 * @returns
 */
export function configIfToCallable(conditional: ScalprumMountPointConfigRawIf) {
  return (entity: Entity, context?: { apis: ApiHolder }) => {
    if (conditional?.allOf) {
      return conditional.allOf
        .map(conditionsArrayMapper)
        .every(f => f(entity, context));
    }
    if (conditional?.anyOf) {
      return conditional.anyOf
        .map(conditionsArrayMapper)
        .some(f => f(entity, context));
    }
    if (conditional?.oneOf) {
      return (
        conditional.oneOf
          .map(conditionsArrayMapper)
          .filter(f => f(entity, context)).length === 1
      );
    }
    return true;
  };
}

export function conditionsArrayMapper(
  condition:
    | {
        [key: string]: string | string[];
      }
    | Function,
): (entity: Entity, context?: { apis: ApiHolder }) => boolean {
  if (typeof condition === 'function') {
    return (entity: Entity, context?: { apis: ApiHolder }): boolean =>
      condition(entity, context);
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
}

export default extractDynamicConfig;
