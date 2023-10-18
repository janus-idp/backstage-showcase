import {
  PluginEndpointDiscovery,
  errorHandler,
} from '@backstage/backend-common';
import { PluginManager } from '@backstage/backend-plugin-manager';
import express from 'express';
import Router from 'express-promise-router';
import { LoggerService } from '@backstage/backend-plugin-api';
import * as url from 'url';
import * as path from 'path';
import * as fs from 'fs';

export interface RouterOptions {
  logger: LoggerService;
  pluginManager: PluginManager;
  discovery: PluginEndpointDiscovery;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, pluginManager, discovery } = options;

  const router = Router();
  router.use(express.json());
  const externalBaseUrl = await discovery.getExternalBaseUrl('scalprum');

  const availablePackages = pluginManager.availablePackages;
  const plugins = pluginManager.plugins;

  const scalprumPlugins: {
    [key: string]: { name: string; manifestLocation: string };
  } = {};

  plugins
    .filter(p => p.platform === 'web')
    .forEach(plugin => {
      const pkg = availablePackages.find(
        p =>
          p.manifest.name === plugin.name &&
          p.manifest.version === plugin.version,
      );
      if (!pkg) {
        logger.warn(
          `Could not find package for plugin ${plugin.name}@${plugin.version}`,
        );
        return;
      }

      const scalprumEntry = (pkg.manifest as any).scalprum;
      if (!scalprumEntry || !scalprumEntry.name) {
        logger.warn(
          `Could not find scalprum entry for plugin ${plugin.name}@${plugin.version}`,
        );
        return;
      }

      const pkgDistLocation: string = path.resolve(
        url.fileURLToPath(pkg.location),
        'dist-scalprum',
      );
      if (!fs.existsSync(pkgDistLocation)) {
        logger.warn(
          `Could not find 'scalprum-dist' folder for plugin ${plugin.name}@${plugin.version}`,
        );
        return;
      }

      const pkgManifestLocation = path.resolve(
        pkgDistLocation,
        'plugin-manifest.json',
      );
      if (!fs.existsSync(pkgManifestLocation)) {
        logger.warn(
          `Could not find 'dist-scalprum/plugin-manifest.json' for plugin ${plugin.name}@${plugin.version}`,
        );
        return;
      }

      router.use(`/${scalprumEntry.name}`, express.static(pkgDistLocation));

      scalprumPlugins[scalprumEntry.name] = {
        name: scalprumEntry.name,
        manifestLocation: `${externalBaseUrl}/${scalprumEntry.name}/plugin-manifest.json`,
      };
    });

  router.get('/plugins', (_, response) => {
    response.send(scalprumPlugins);
  });

  router.use(errorHandler({ logger: logger }));
  return router;
}
