import { Page } from "@playwright/test";
import playwrightConfig from "../../../playwright.config";
import { Sidebar, SidebarOptions } from "../pages/sidebar";

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

  async getApiToken(page: Page): Promise<string> {
    if (!this.token) {
      const _t = await this._getApiToken(page);
      this.token = _t;
    }
    return this.token;
  }

  private async _getApiToken(page: Page) {
    const sidebar = new Sidebar(page);

    await sidebar.open(SidebarOptions.Catalog);
    const requestPromise = page.waitForRequest(
      (request) =>
        request.url() ===
          `${playwrightConfig.use.baseURL}/api/search/query?term=` &&
        request.method() === "GET",
    );
    await sidebar.open(SidebarOptions.Home);
    const getRequest = await requestPromise;
    const authToken = await getRequest.headerValue("Authorization");
    return authToken;
  }
}
