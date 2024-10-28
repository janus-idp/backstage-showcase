import { CommonJSModuleLoader } from '@backstage/backend-dynamic-feature-service';
import { LoggerService } from '@backstage/backend-plugin-api';

import path from 'path';

export const moduleLoader = (logger: LoggerService) =>
  new CommonJSModuleLoader({
    logger,
    customResolveDynamicPackage(
      _,
      searchedPackageName,
      scannedPluginManifests,
    ) {
      for (const [realPath, pkg] of scannedPluginManifests.entries()) {
        if (!pkg.dependencies?.[searchedPackageName]) {
          continue;
        }

        const searchPath = path.resolve(realPath, 'node_modules');
        try {
          const resolvedPath = require.resolve(
            `${searchedPackageName}/package.json`,
            {
              paths: [searchPath],
            },
          );
          logger.info(
            `Resolved package '${searchedPackageName}' at ${resolvedPath}`,
          );
          return resolvedPath;
        } catch (e) {
          logger.error(
            `Error when resolving '${searchedPackageName}' with search path: '[${searchPath}]'`,
            e instanceof Error ? e : undefined,
          );
        }
      }

      return undefined;
    },
  });
