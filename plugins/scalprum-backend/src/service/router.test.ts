import express, { Router } from 'express';
import request from 'supertest';
import url from 'url';
import path from 'path';
import { createRouter } from './router';
import {
  PluginManager,
  ScannedPluginManifest,
  ScannedPluginPackage,
} from '@backstage/backend-plugin-manager';
import mockFs from 'mock-fs';
import { randomUUID } from 'crypto';
import { LoggerService } from '@backstage/backend-plugin-api';

describe('createRouter', () => {
  let app: express.Express;
  let router: Router;

  beforeEach(() => {
    app = express();
  });

  afterEach(() => {
    jest.resetAllMocks();
    mockFs.restore();
    app.delete('scalprum');
  });

  type TestCase = {
    name: string;
    packageManifest: ScannedPluginManifest & { scalprum?: { name: string } };
    pluginExternalBaseURL: string;
    distScalprumDir?: any;
    testedPluginsURL: string;
    expectedPluginsStatusCode: number;
    expectedPluginsBody: any;
    testedManifestURL?: string;
    expectedManifestStatusCode?: number;
    expectedManifestBody?: any;
    expectedWarning?: string;
  };

  it.each<TestCase>([
    {
      name: 'should add the frontend plugin in the scalprum plugin map',
      packageManifest: {
        name: 'frontend-dynamic-plugin-test',
        version: '0.0.0',
        backstage: {
          role: 'frontend-plugin',
        },
        main: 'dist/index.cjs.js',
        scalprum: {
          name: 'scalprum-plugin',
        },
      },
      pluginExternalBaseURL: 'http://localhost:3000',
      distScalprumDir: mockFs.directory({
        items: {
          'plugin-manifest.json': mockFs.file({
            content: JSON.stringify({
              name: 'scalprum-plugin',
              anotherField: 'anotherValue',
            }),
          }),
        },
      }),
      testedPluginsURL: '/scalprum/plugins',
      expectedPluginsStatusCode: 200,
      expectedPluginsBody: {
        'scalprum-plugin': {
          manifestLocation:
            'http://localhost:3000/scalprum-plugin/plugin-manifest.json',
          name: 'scalprum-plugin',
        },
      },
      testedManifestURL: '/scalprum/scalprum-plugin/plugin-manifest.json',
      expectedManifestStatusCode: 200,
      expectedManifestBody: {
        name: 'scalprum-plugin',
        anotherField: 'anotherValue',
      },
    },
    {
      name: 'should skip a frontend plugin when the dist-scalprum sub-folder is missing',
      packageManifest: {
        name: 'frontend-dynamic-plugin-test',
        version: '0.0.0',
        backstage: {
          role: 'frontend-plugin',
        },
        main: 'dist/index.cjs.js',
        scalprum: {
          name: 'scalprum-plugin',
        },
      },
      pluginExternalBaseURL: 'http://localhost:3000',
      testedPluginsURL: '/scalprum/plugins',
      expectedPluginsStatusCode: 200,
      expectedPluginsBody: {},
      expectedWarning:
        "Could not find 'scalprum-dist' folder for plugin frontend-dynamic-plugin-test@0.0.0",
    },
    {
      name: 'should skip a frontend plugin when the dist-scalprum/plugin-manifest.json file is missing',
      packageManifest: {
        name: 'frontend-dynamic-plugin-test',
        version: '0.0.0',
        backstage: {
          role: 'frontend-plugin',
        },
        main: 'dist/index.cjs.js',
        scalprum: {
          name: 'scalprum-plugin',
        },
      },
      pluginExternalBaseURL: 'http://localhost:3000',
      distScalprumDir: mockFs.directory({}),
      testedPluginsURL: '/scalprum/plugins',
      expectedPluginsStatusCode: 200,
      expectedPluginsBody: {},
      expectedWarning:
        "Could not find 'dist-scalprum/plugin-manifest.json' for plugin frontend-dynamic-plugin-test@0.0.0",
    },
  ])('$name', async (tc: TestCase): Promise<void> => {
    const plugin: ScannedPluginPackage = {
      location: url.pathToFileURL(
        path.resolve(`/node_modules/jest-tests/${randomUUID()}`),
      ),
      manifest: tc.packageManifest,
    };

    const mockedFiles: { [key: string]: any } = {};

    if (tc.distScalprumDir) {
      mockedFiles[
        path.join(url.fileURLToPath(plugin.location), 'dist-scalprum')
      ] = tc.distScalprumDir;
    }

    mockFs(mockedFiles);

    const warn = jest.fn();
    const logger: LoggerService = {
      error: jest.fn(),
      warn: warn,
      info: jest.fn(),
      debug: jest.fn(),
      child: jest.fn(),
    };

    const pluginManager = new (PluginManager as any)(logger, [plugin], {
      logger,
      async bootstrap(_: string, __: string[]): Promise<void> {},
      load: async (packagePath: string) =>
        await import(/* webpackIgnore: true */ packagePath),
    });
    pluginManager.plugins.push(...(await pluginManager.loadPlugins()));

    const getBaseUrl = jest.fn().mockReturnValue('should-not-be-used');
    const getExternalBaseUrl = jest
      .fn()
      .mockReturnValue(tc.pluginExternalBaseURL);

    router = await createRouter({
      logger: logger,
      discovery: {
        getBaseUrl,
        getExternalBaseUrl,
      },
      pluginManager,
    });

    app.use('/scalprum', router);
    const response = await request(app).get(tc.testedPluginsURL);
    expect(response.status).toEqual(tc.expectedPluginsStatusCode);
    expect(response.body).toEqual(tc.expectedPluginsBody);

    let manifestStatusCode: number | undefined;
    let manifestBody: any | undefined;
    if (tc.testedManifestURL) {
      const manifestResponse = await request(app).get(tc.testedManifestURL);
      manifestStatusCode = manifestResponse.status;
      manifestBody = manifestResponse.body;
    }
    expect(manifestStatusCode).toEqual(tc.expectedManifestStatusCode);
    expect(manifestBody).toEqual(tc.expectedManifestBody);

    if (tc.expectedWarning) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(warn).toHaveBeenCalledWith(tc.expectedWarning);
    }
  });
});
