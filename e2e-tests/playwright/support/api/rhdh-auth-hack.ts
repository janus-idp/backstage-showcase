import { request } from '@playwright/test';
import playwrightConfig from '../../../playwright.config';

//https://redhatquickcourses.github.io/devhub-admin/devhub-admin/1/chapter2/rbac.html#_lab_rbac_rest_api
export class RhdhAuthHack {
  async getApiToken() {
    const context = await request.newContext({
      baseURL: playwrightConfig.use.baseURL,
    });
    const res = context.get('/catalog');
    return (await res).headers['Authorization'];
  }
}
