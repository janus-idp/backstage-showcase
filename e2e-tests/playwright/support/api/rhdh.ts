import { APIResponse, BrowserContext, request } from '@playwright/test';
import { RhdhAuthHack } from './rhdh-auth-hack';
import playwrightConfig from '../../../playwright.config';
import { Role } from '../pages/rbac';

export class RhdhApi {
  private readonly API_URL = `${playwrightConfig.use.baseURL}/api/`;
  private browserContext: BrowserContext;

  constructor(browserContext: BrowserContext) {
    this.browserContext = browserContext;
  }

  async getRoles(): Promise<APIResponse> {
    const req = await this._permission().roles().get();
    return req.json();
  }

  async getPolicies(): Promise<APIResponse> {
    const req = await this._permission().policies().get();
    return req.json();
  }

  private async _myContext(extraHeader?: { [key: string]: string }) {
    const auth = await RhdhAuthHack.getInstance().getApiToken(
      this.browserContext,
    );

    return request.newContext({
      baseURL: this.API_URL,
      extraHTTPHeaders: {
        authorization: auth,
        ...extraHeader,
      },
    });
  }

  private _permission() {
    let url = `permission/`;
    return {
      roles: (): { get; post } => {
        url += 'roles';
        return {
          get: async (): Promise<APIResponse> => {
            return (await this._myContext()).get(url);
          },
          post: async (role: Role): Promise<APIResponse> => {
            return (
              await this._myContext({ 'Content-Type': 'application/json' })
            ).post(url, { data: role });
          },
        };
      },
      policies: (): { get } => {
        url += 'policies';
        return {
          get: async (): Promise<APIResponse> => {
            return (await this._myContext()).get(url);
          },
        };
      },
    };
  }
}
