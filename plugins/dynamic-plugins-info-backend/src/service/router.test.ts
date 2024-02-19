import express from 'express';
import request from 'supertest';
import { plugins } from '../../__fixtures__/data';
import { expectedList } from '../../__fixtures__/expected_result';
import { createRouter } from './router';
import { DynamicPluginManager } from '@backstage/backend-dynamic-feature-service';

describe('createRouter', () => {
  let app: express.Express;

  beforeAll(async () => {
    const pluginManager = new (DynamicPluginManager as any)();
    pluginManager._plugins = plugins;

    const router = await createRouter({
      pluginProvider: pluginManager,
    });

    app = express();
    app = express().use(router);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /loaded-plugins', () => {
    it('returns the list of loaded dynamic plugins', async () => {
      const response = await request(app).get('/loaded-plugins');
      expect(response.status).toEqual(200);
      expect(response.body).toEqual(expectedList);
    });
  });
});
