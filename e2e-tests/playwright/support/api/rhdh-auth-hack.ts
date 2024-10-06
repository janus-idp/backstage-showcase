import { BrowserContext } from '@playwright/test';
import { UIhelper } from '../../utils/UIhelper';
import playwrightConfig from '../../../playwright.config';
import { Common } from '../../utils/Common';

//https://redhatquickcourses.github.io/devhub-admin/devhub-admin/1/chapter2/rbac.html#_lab_rbac_rest_api
export class RhdhAuthHack {
  private static instance: RhdhAuthHack;
  private token?: string;

  private constructor() {}

  public static getInstance(): RhdhAuthHack {
    if (!RhdhAuthHack.instance) {
      RhdhAuthHack.instance = new RhdhAuthHack();
    }
    return RhdhAuthHack.instance;
  }

  async getApiToken(context: BrowserContext): Promise<string> {
    if (!this.token) {
      const _t = await this._getApiToken(context);
      this.token = _t;
    }
    return this.token;
  }

  private async _getApiToken(context: BrowserContext) {
    const page = await context.newPage();
    const uiHelper = new UIhelper(page);
    const common = new Common(page);
    await common.loginAsGithubUser();

    await uiHelper.openSidebar('Catalog');
    const requestPromise = page.waitForRequest(
      request =>
        request.url() ===
          `${playwrightConfig.use.baseURL}/api/search/query?term=` &&
        request.method() === 'GET',
    );
    await uiHelper.openSidebar('Home');
    const getRequest = await requestPromise;
    const authToken = await getRequest.headerValue('Authorization');
    await page.close();
    return authToken;
  }
}
