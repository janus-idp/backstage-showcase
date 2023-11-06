import {
  PluginEndpointDiscovery,
  errorHandler,
} from '@backstage/backend-common';
import { LoggerService } from '@backstage/backend-plugin-api';
import { PluginManager } from '@backstage/backend-plugin-manager';
import express, { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

export interface RouterOptions {
  logger: LoggerService;
  pluginManager: PluginManager;
  discovery: PluginEndpointDiscovery;
}

export async function createRouter(options: RouterOptions): Promise<Router> {
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

      const pkgManifest = JSON.parse(
        fs.readFileSync(pkgManifestLocation).toString(),
      );

      router.use(`/${pkgManifest.name}`, express.static(pkgDistLocation));

      scalprumPlugins[pkgManifest.name] = {
        name: pkgManifest.name,
        manifestLocation: `${externalBaseUrl}/${pkgManifest.name}/plugin-manifest.json`,
      };
    });

  router.get('/plugins', (_, response) => {
    response.send(scalprumPlugins);
  });

  router.use(errorHandler({ logger: logger }));
  return router;
}
