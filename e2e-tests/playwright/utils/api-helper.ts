import { request, APIResponse, expect } from "@playwright/test";
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

  static async initCommit(owner: string, repo: string, branch = "main") {
    const content = Buffer.from(
      "This is the initial commit for the repository.",
    ).toString("base64");
    await APIHelper.githubRequest(
      "PUT",
      `${GITHUB_API_ENDPOINTS.contents(owner, repo)}/initial-commit.md`,
      {
        message: "Initial commit",
        content: content,
        branch: branch,
      },
    );
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
}
