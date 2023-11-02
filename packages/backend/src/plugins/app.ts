import { createRouter } from '@backstage/plugin-app-backend';
import { Router } from 'express';
import type { PluginEnvironment } from '../types';
import { resolvePackagePath } from '@backstage/backend-common';
import { resolve as resolvePath } from 'path';
import fs from 'fs-extra';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const appPackageName = 'app';

  const appDistDir = resolvePackagePath(appPackageName, 'dist');
  const staticDir = resolvePath(appDistDir, 'static');

  const files = await fs.readdir(staticDir);
  const jsFiles = files.filter(file => file.endsWith('.js'));
  let injectedJSFile: string | undefined = undefined;

  for (const jsFile of jsFiles) {
    const path = resolvePath(staticDir, jsFile);

    const content = await fs.readFile(path, 'utf8');
    if (content.includes('__APP_INJECTED_')) {
      injectedJSFile = jsFile;
      break;
    }
  }

  const router = await createRouter({
    logger: env.logger,
    config: env.config,
    database: env.database,
    appPackageName,
  });

  const enclosingRouter = Router();
  if (injectedJSFile) {
    env.logger.info(
      `Setting up static router for injected Javascript file ${injectedJSFile}`,
    );

    enclosingRouter.get(`/static/${injectedJSFile}`, (_req, res) => {
      env.logger.info(
        `Serving in the injected Javascript file with caching disabled`,
      );
      res.sendFile(resolvePath(staticDir, injectedJSFile!), {
        headers: {
          'cache-control': 'no-store, max-age=0',
        },
      });
    });
  }

  enclosingRouter.use(router);
  return enclosingRouter;
}
