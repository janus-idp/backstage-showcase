import { APIRequestContext, request } from "@playwright/test";
import playwrightConfig from "../../../playwright.config";

export class RhdhRbacClient {
  private requestContext: APIRequestContext;

  private constructor(requestContext: APIRequestContext) {
    this.requestContext = requestContext;
  }

  static async build(
    token: string,
    baseUrl = playwrightConfig.use.baseURL + "/api",
  ): Promise<RhdhRbacClient> {
    const requestContext = await request.newContext({
      baseURL: baseUrl,
      extraHTTPHeaders: {
        Authorization: "Bearer " + token,
      },
    });
    return new RhdhRbacClient(requestContext);
  }

  public async getAllRoles() {
    return await this.requestContext.get("permission/roles");
  }

  public async getAllPolicies() {
    return await this.requestContext.get("permission/policies");
  }
}
