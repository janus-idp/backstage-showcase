import { request, APIResponse, expect } from "@playwright/test";
import * as authProvidersConstants from "./authenticationProviders/constants";
import { GroupEntity, UserEntity } from "@backstage/catalog-model";
import { GITHUB_API_ENDPOINTS } from "./api-endpoints";

type FetchOptions = {
  method: string;
  headers: {
    Accept: string;
    Authorization: string;
    "X-GitHub-Api-Version": string;
  };
  data?: string | object;
};

export class APIHelper {
  private static githubAPIVersion = "2022-11-28";
  private staticToken: string;
  useStaticToken = false;

  static async githubRequest(
    method: string,
    url: string,
    body?: string | object,
  ): Promise<APIResponse> {
    const context = await request.newContext();
    const options: FetchOptions = {
      method: method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.GH_RHDH_QE_USER_TOKEN}`,
        "X-GitHub-Api-Version": this.githubAPIVersion,
      },
    };

    if (body) {
      options.data = body;
    }

    const response = await context.fetch(url, options);
    return response;
  }

  static async getGithubPaginatedRequest(
    url: string,
    pageNo = 1,
    response = [],
  ) {
    const fullUrl = `${url}&page=${pageNo}`;
    const result = await this.githubRequest("GET", fullUrl);
    const body = await result.json();

    if (!Array.isArray(body)) {
      throw new Error(
        `Expected array but got ${typeof body}: ${JSON.stringify(body)}`,
      );
    }

    if (body.length === 0) {
      return response;
    }

    response = [...response, ...body];
    return await this.getGithubPaginatedRequest(url, pageNo + 1, response);
  }

  static async createGitHubRepo(owner: string, repoName: string) {
    await APIHelper.githubRequest(
      "POST",
      GITHUB_API_ENDPOINTS.createRepo(owner),
      {
        name: repoName,
        private: false,
      },
    );
  }

  static async initCommit(
    owner: string,
    repo: string,
    branch = "main",
    retries = 3,
    delay = 2000,
  ) {
    const content = Buffer.from(
      "This is the initial commit for the repository.",
    ).toString("base64");

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response: APIResponse = await APIHelper.githubRequest(
          "PUT",
          `${GITHUB_API_ENDPOINTS.contents(owner, repo)}/initial-commit.md`,
          {
            message: "Initial commit",
            content: content,
            branch: branch,
          },
        );

        if (response.ok()) {
          console.log(`Initial commit successful on attempt ${attempt}`);
          return;
        } else {
          console.error(`Attempt ${attempt} failed: ${response.statusText()}`);
        }
      } catch (error) {
        console.error(`Attempt ${attempt} encountered an error: ${error}`);
      }

      if (attempt < retries) {
        console.log(`Retrying in ${delay} ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error(`Failed to make initial commit after ${retries} attempts`);
  }

  static async deleteGitHubRepo(owner: string, repoName: string) {
    await APIHelper.githubRequest(
      "DELETE",
      GITHUB_API_ENDPOINTS.deleteRepo(owner, repoName),
    );
  }

  static async mergeGitHubPR(
    owner: string,
    repoName: string,
    pullNumber: number,
  ) {
    await APIHelper.githubRequest(
      "PUT",
      GITHUB_API_ENDPOINTS.mergePR(owner, repoName, pullNumber),
    );
  }

  static async getGitHubPRs(
    owner: string,
    repoName: string,
    state: "open" | "closed" | "all",
    paginated = false,
  ) {
    const url = GITHUB_API_ENDPOINTS.pull(owner, repoName, state);
    if (paginated) {
      return await APIHelper.getGithubPaginatedRequest(url);
    }
    const response = await APIHelper.githubRequest("GET", url);
    return response.json();
  }

  static async getfileContentFromPR(
    owner: string,
    repoName: string,
    pr: number,
    filename: string,
  ): Promise<string> {
    const response = await APIHelper.githubRequest(
      "GET",
      GITHUB_API_ENDPOINTS.pull_files(owner, repoName, pr),
    );
    const fileRawUrl = (await response.json()).find(
      (file: { filename: string }) => file.filename === filename,
    ).raw_url;
    const rawFileContent = await (
      await APIHelper.githubRequest("GET", fileRawUrl)
    ).text();
    return rawFileContent;
  }

  async getGuestToken(): Promise<string> {
    const context = await request.newContext();
    const response = await context.post("/api/auth/guest/refresh");
    expect(response.status()).toBe(200);
    const data = await response.json();
    return data.backstageIdentity.token;
  }

  async getGuestAuthHeader(): Promise<{ [key: string]: string }> {
    const token = await this.getGuestToken();
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    return headers;
  }

  async UseStaticToken(token: string) {
    this.useStaticToken = true;
    this.staticToken = "Bearer " + token;
  }

  static async APIRequestWithStaticToken(
    method: string,
    url: string,
    staticToken: string,
    body?: string | object,
  ): Promise<APIResponse> {
    const context = await request.newContext();
    const options = {
      method: method,
      headers: {
        Accept: "application/json",
        Authorization: `${staticToken}`,
      },
    };

    if (body) {
      options["data"] = body;
    }

    const response = await context.fetch(url, options);
    return response;
  }

  async getAllCatalogUsersFromAPI() {
    const url = `${authProvidersConstants.AUTH_PROVIDERS_BASE_URL}/api/catalog/entities/by-query?orderField=metadata.name%2Casc&filter=kind%3Duser`;
    const token = this.useStaticToken ? this.staticToken : "";
    const response = await APIHelper.APIRequestWithStaticToken(
      "GET",
      url,
      token,
    );
    return response.json();
  }

  async getAllCatalogLocationsFromAPI() {
    const url = `${authProvidersConstants.AUTH_PROVIDERS_BASE_URL}/api/catalog/entities/by-query?orderField=metadata.name%2Casc&filter=kind%3Dlocation`;
    const token = this.useStaticToken ? this.staticToken : "";
    const response = await APIHelper.APIRequestWithStaticToken(
      "GET",
      url,
      token,
    );
    return response.json();
  }

  async getAllCatalogGroupsFromAPI() {
    const url = `${authProvidersConstants.AUTH_PROVIDERS_BASE_URL}/api/catalog/entities/by-query?orderField=metadata.name%2Casc&filter=kind%3Dgroup`;
    const token = this.useStaticToken ? this.staticToken : "";
    const response = await APIHelper.APIRequestWithStaticToken(
      "GET",
      url,
      token,
    );
    return response.json();
  }

  async getGroupEntityFromAPI(group: string) {
    const url = `${authProvidersConstants.AUTH_PROVIDERS_BASE_URL}/api/catalog/entities/by-name/group/default/${group}`;
    const token = this.useStaticToken ? this.staticToken : "";
    const response = await APIHelper.APIRequestWithStaticToken(
      "GET",
      url,
      token,
    );
    return response.json();
  }

  async getCatalogUserFromAPI(user: string) {
    const url = `${authProvidersConstants.AUTH_PROVIDERS_BASE_URL}/api/catalog/entities/by-name/user/default/${user}`;
    const token = this.useStaticToken ? this.staticToken : "";
    const response = await APIHelper.APIRequestWithStaticToken(
      "GET",
      url,
      token,
    );
    return response.json();
  }

  async deleteUserEntityFromAPI(user: string) {
    const r: UserEntity = await this.getCatalogUserFromAPI(user);
    if (!r.metadata || !r.metadata.uid) {
      return;
    }
    const url = `${authProvidersConstants.AUTH_PROVIDERS_BASE_URL}/api/catalog/entities/by-uid/${r.metadata.uid}`;
    const token = this.useStaticToken ? this.staticToken : "";
    const response = await APIHelper.APIRequestWithStaticToken(
      "DELETE",
      url,
      token,
    );
    return response.statusText;
  }

  async getCatalogGroupFromAPI(group: string) {
    const url = `${authProvidersConstants.AUTH_PROVIDERS_BASE_URL}/api/catalog/entities/by-name/group/default/${group}`;
    const token = this.useStaticToken ? this.staticToken : "";
    const response = await APIHelper.APIRequestWithStaticToken(
      "GET",
      url,
      token,
    );
    return response.json();
  }

  async deleteGroupEntityFromAPI(group: string) {
    const r: GroupEntity = await this.getCatalogGroupFromAPI(group);
    const url = `${authProvidersConstants.AUTH_PROVIDERS_BASE_URL}/api/catalog/entities/by-uid/${r.metadata.uid}`;
    const token = this.useStaticToken ? this.staticToken : "";
    const response = await APIHelper.APIRequestWithStaticToken(
      "DELETE",
      url,
      token,
    );
    return response.statusText;
  }

  async scheduleEntityRefreshFromAPI(
    entity: string,
    kind: string,
    token: string,
  ) {
    const url = `${authProvidersConstants.AUTH_PROVIDERS_BASE_URL}/api/catalog/refresh`;
    const reqBody = { entityRef: `${kind}:default/${entity}` };
    const responseRefresh = await APIHelper.APIRequestWithStaticToken(
      "POST",
      url,
      token,
      reqBody,
    );
    return responseRefresh.status();
  }
}
