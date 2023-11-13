import { PluginManager } from '@backstage/backend-plugin-manager';
import { Logger } from 'winston';
import fs from 'fs-extra';
import * as path from 'path';
import * as url from 'url';
import { isEmpty } from 'lodash';
import type { Config } from '@backstage/config';
import { loadConfigSchema } from '@backstage/config-loader';

export async function gatherDynamicPluginsSchemas(
  pluginManager: PluginManager,
  logger: Logger,
): Promise<{ value: any; path: string }[]> {
  const allSchemas: { value: any; path: string }[] = [];

  for (const plugin of pluginManager.plugins) {
    const pluginPackage = pluginManager.availablePackages.find(
      pkg =>
        pkg.manifest.name === plugin.name &&
        pkg.manifest.version === plugin.version,
    );

    if (!pluginPackage) {
      throw new Error(`Could not find package for plugin ${plugin.name}`);
    }

    const distDir = plugin.platform === 'node' ? 'dist' : 'dist-scalprum';
    const schemaLocation: string = path.resolve(
      url.fileURLToPath(pluginPackage.location),
      distDir,
      'configSchema.json',
    );
    if (!(await fs.pathExists(schemaLocation))) {
      continue;
    }

    const serialized = await fs.readJson(schemaLocation);
    if (!serialized) {
      continue;
    }

    if (isEmpty(serialized)) {
      continue;
    }

    if (!serialized?.$schema || serialized?.type !== 'object') {
      logger.error(
        `Serialized configuration schema is invalid for plugin ${plugin.name}`,
      );
      continue;
    }

    allSchemas.push({
      path: schemaLocation,
      value: serialized,
    });
  }

  return allSchemas;
}

export async function createDynamicPluginsConfigSecretEnumerator(
  schemas: { value: any; path: string }[],
  logger: Logger,
): Promise<(config: Config) => Iterable<string>> {
  const schema = await loadConfigSchema({
    serialized: {
      backstageConfigSchemaVersion: 1,
      schemas: schemas,
    },
  });

  return (config: Config) => {
    if (schemas.length === 0) {
      return [];
    }

    const [secretsData] = schema
      .process(
        [{ data: config.getOptional() ?? {}, context: 'schema-enumerator' }],
        {
          visibility: ['secret'],
          ignoreSchemaErrors: true,
        },
      )
      .map(({ data }) => data);
    const secrets = new Set<string>();
    JSON.parse(
      JSON.stringify(secretsData),
      (_, v) => typeof v === 'string' && secrets.add(v),
    );

    logger.info(
      `Found ${secrets.size} additional dynamic plugins secrets in config that will be redacted`,
    );

    return secrets;
  };
}

export async function completeFrontendSchemas(
  schemas: { value: any; path: string }[],
  appDistDir: string,
): Promise<void> {
  // Find the frontend schema, and if not already saved, save it to '.config-schema.original.json'
  const frontendBuiltSchemaPath = path.resolve(
    appDistDir,
    '.config-schema.json',
  );
  let originalfrontendBuiltSchemaPath = path.resolve(
    appDistDir,
    '.config-schema.original.json',
  );

  if (!(await fs.pathExists(originalfrontendBuiltSchemaPath))) {
    if (await fs.pathExists(frontendBuiltSchemaPath)) {
      await fs.copyFile(
        frontendBuiltSchemaPath,
        originalfrontendBuiltSchemaPath,
      );
    }
    originalfrontendBuiltSchemaPath = frontendBuiltSchemaPath;
  }

  // Read the frontend schemas from the original frontend schema file
  const frontendSchemas: { value: any; path: string }[] = [];
  if (await fs.pathExists(originalfrontendBuiltSchemaPath)) {
    const frontendSerialized = await fs.readJson(frontendBuiltSchemaPath);

    if (frontendSerialized?.backstageConfigSchemaVersion !== 1) {
      throw new Error(
        `Serialized configuration schema for the frontend is invalid or has an invalid version number`,
      );
    }
    frontendSchemas.push(
      ...(frontendSerialized.schemas as { value: any; path: string }[]),
    );
  }

  // overwite the frontend schema file with one completed with the dynamic plugins schemas.
  await fs.writeJSON(
    frontendBuiltSchemaPath,
    {
      backstageConfigSchemaVersion: 1,
      schemas: [...frontendSchemas, ...schemas],
    },
    { spaces: 2 },
  );
}
