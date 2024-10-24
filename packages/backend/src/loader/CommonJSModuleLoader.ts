import {
  ModuleLoader,
  ScannedPluginManifest,
} from '@backstage/backend-dynamic-feature-service';
import { LoggerService } from '@backstage/backend-plugin-api';

import * as fs from 'fs';
import path from 'path';

export class CommonJSModuleLoader implements ModuleLoader {
  constructor(public readonly logger: LoggerService) {}

  async bootstrap(
    backstageRoot: string,
    dynamicPluginsPaths: string[],
  ): Promise<void> {
    const backstageRootNodeModulesPath = `${backstageRoot}/node_modules`;
    const dynamicNodeModulesPaths = [
      ...dynamicPluginsPaths.map(p => path.resolve(p, 'node_modules')),
    ];
    const ModuleObject = require('module');
    const oldNodeModulePaths = ModuleObject._nodeModulePaths;
    ModuleObject._nodeModulePaths = (from: string): string[] => {
      const result: string[] = oldNodeModulePaths(from);
      if (!dynamicPluginsPaths.some(p => from.startsWith(p))) {
        return result;
      }
      const filtered = result.filter(nodeModulePath => {
        return (
          nodeModulePath === backstageRootNodeModulesPath ||
          dynamicNodeModulesPaths.some(p => nodeModulePath.startsWith(p))
        );
      });
      this.logger.debug(
        `Overriding node_modules search path for dynamic plugin ${from} to: ${filtered}`,
      );
      return filtered;
    };

    let dynamicPluginPackages: {
      name: string;
      dependencies: string[];
      path: string;
    }[] = [];
    let dynamicPluginPackagesFilled = false;

    const oldResolveFileName = ModuleObject._resolveFilename;
    ModuleObject._resolveFilename = (
      request: string,
      mod: NodeModule,
      _: boolean,
      options: any,
    ): any => {
      let errorToThrow: any;
      try {
        return oldResolveFileName(request, mod, _, options);
      } catch (e) {
        errorToThrow = e;
        this.logger.debug(
          `Could not resolve '${request}' in the Core backstage backend application`,
          e instanceof Error ? e : undefined,
        );
      }

      const mostProbablyCallingResolvePackagePath =
        // Are we searching for the folder of a backstage package by calling @backstage/backend-plugin-api/resolvePackagePath ?
        // => are we trying to resolve a `package.json` ...
        request?.endsWith('/package.json') &&
        // ... from an originating module of the core backstage application (not directly from a dynamic plugin folder)
        mod?.path &&
        !dynamicPluginsPaths.some(p => mod.path.startsWith(p)) &&
        // ... and the originating module is `backend-plugin-api`
        (mod.path.includes(`backend-plugin-api`) ||
          // or `backend-common` (when using the deprecated `@backstage/backend-common/resolvepackagePath`)
          mod.path.includes(`backend-common`));

      if (!mostProbablyCallingResolvePackagePath) {
        throw errorToThrow;
      }

      this.logger.info(`Resolving '${request}' in the dynamic backend plugins`);

      if (!dynamicPluginPackagesFilled) {
        dynamicPluginPackagesFilled = true;
        dynamicPluginPackages =
          this.buildDynamicPluginPackages(dynamicPluginsPaths);
      }

      const searchedPackageName = request.replace(/\/package.json$/, '');
      const searchedPackageNameDynamic = `${searchedPackageName}-dynamic`;
      for (const p of dynamicPluginPackages) {
        // Case of a dynamic plugin package
        if (
          [searchedPackageName, searchedPackageNameDynamic].includes(p.name)
        ) {
          const resolvedPath = path.resolve(p.path, 'package.json');
          this.logger.info(`Resolved '${request}' at ${resolvedPath}`);
          return resolvedPath;
        }

        // Case of a dynamic plugin wrapper package
        if (p.dependencies.includes(searchedPackageName)) {
          const searchPath = path.resolve(p.path, 'node_modules');
          try {
            const resolvedPath = require.resolve(
              `${searchedPackageName}/package.json`,
              {
                paths: [searchPath],
              },
            );
            this.logger.info(`Resolved '${request}' at ${resolvedPath}`);
            return resolvedPath;
          } catch (e) {
            this.logger.error(
              `Error when resolving '${searchedPackageName}' with search path: '[${searchPath}]'`,
              e instanceof Error ? e : undefined,
            );
          }
        }
      }

      throw errorToThrow;
    };
  }

  buildDynamicPluginPackages(dynamicPluginsPaths: string[]) {
    const dynamicPluginPackages: {
      name: string;
      dependencies: string[];
      path: string;
    }[] = [];
    dynamicPluginsPaths.forEach(p => {
      try {
        const manifestFile = path.resolve(p, 'package.json');
        const content = fs.readFileSync(manifestFile);
        const manifest: ScannedPluginManifest = JSON.parse(content.toString());
        dynamicPluginPackages.push({
          name: manifest.name,
          dependencies: Object.keys(manifest.dependencies || {}),
          path: p,
        });
      } catch (e) {
        this.logger.error(
          `Error when reading 'package.json' in '${p}'`,
          e instanceof Error ? e : undefined,
        );
      }
    });
    return dynamicPluginPackages;
  }

  async load(packagePath: string): Promise<any> {
    return await require(/* webpackIgnore: true */ packagePath);
  }
}
