import { getVoidLogger } from '@backstage/backend-common';
import express from 'express';
import request from 'supertest';
import { plugins } from '../../__fixtures__/data';
import { expectedList } from '../../__fixtures__/expected_result';
import { createRouter } from './router';
import { PluginManager } from '@backstage/backend-plugin-manager';

describe('createRouter', () => {
  let app: express.Express;

  beforeAll(async () => {
    const pluginManager = new (PluginManager as any)();
    pluginManager.plugins = plugins;

    const router = await createRouter({
      logger: getVoidLogger(),
      pluginManager,
    });

    app = express();
    app = express().use(router);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /dynamic-plugins', () => {
    it('returns the list of dynamic plugins', async () => {
      const response = await request(app).get('/dynamic-plugins');
      expect(response.status).toEqual(200);
      expect(response.body).toEqual(expectedList);
    });
  });
});
