import { createRouter } from '@backstage/plugin-app-backend';
import { Router } from 'express';
import type { PluginEnvironment } from '../types';
import { resolvePackagePath } from '@backstage/backend-common';
import { resolve as resolvePath } from 'path';
import fs from 'fs-extra';
import rateLimit from 'express-rate-limit';
import { completeFrontendSchemas } from '../schemas';

export default async function createPlugin(
  env: PluginEnvironment,
  dynamicPluginsSchemas: { value: any; path: string }[],
): Promise<Router> {
  const appPackageName = 'app';

  const appDistDir = resolvePackagePath(appPackageName, 'dist');
  const staticDir = resolvePath(appDistDir, 'static');

  if (await fs.pathExists(appDistDir)) {
    await completeFrontendSchemas(dynamicPluginsSchemas, appDistDir);
  }

  let injectedJSFile: string | undefined = undefined;

  if (await fs.pathExists(staticDir)) {
    const files = await fs.readdir(staticDir);
    const jsFiles = files.filter(file => file.endsWith('.js'));

    for (const jsFile of jsFiles) {
      const path = resolvePath(staticDir, jsFile);

      const content = await fs.readFile(path, 'utf8');
      if (content.includes('__APP_INJECTED_')) {
        injectedJSFile = jsFile;
        break;
      }
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

    enclosingRouter.get(
      `/static/${injectedJSFile}`,
      rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
      }),
      (_req, res) => {
        env.logger.info(
          `Serving in the injected Javascript file with caching disabled`,
        );
        res.sendFile(resolvePath(staticDir, injectedJSFile!), {
          headers: {
            'cache-control': 'no-cache',
          },
        });
      },
    );
  }

  enclosingRouter.use(router);
  return enclosingRouter;
}
