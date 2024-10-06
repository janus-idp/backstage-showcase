import { BrowserContext, request } from '@playwright/test';
import { RhdhAuthHack } from './rhdh-auth-hack';
import playwrightConfig from '../../../playwright.config';

export class RhdhApi {
  private readonly API_URL = `${playwrightConfig.use.baseURL}/api/`;
  private browserContext: BrowserContext;

  constructor(browserContext: BrowserContext) {
    this.browserContext = browserContext;
  }

  async getRoles(): Promise<any> {
    const req = await this._permission().roles();
    return req.json();
  }

  async getPolicies(): Promise<any> {
    const req = await this._permission().policies();
    return req.json();
  }

  private async _myContext() {
    const auth = await RhdhAuthHack.getInstance().getApiToken(
      this.browserContext,
    );
    return request.newContext({
      baseURL: this.API_URL,
      extraHTTPHeaders: {
        authorization: auth,
      },
    });
  }

  private _permission() {
    let url = `permission/`;
    return {
      roles: async () => {
        url += 'roles';
        return (await this._myContext()).get(url);
      },
      policies: async () => {
        url += 'policies';
        return (await this._myContext()).get(url);
      },
    };
  }
}
