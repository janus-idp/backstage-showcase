import { getOrganizationResponse } from "./github-structures";
import { JANUS_ORG } from "../../utils/constants";
import { APIResponse, request } from "@playwright/test";

// https://docs.github.com/en/rest?apiVersion=2022-11-28
export default class GithubApi {
  private readonly API_URL = "https://api.github.com";
  private readonly API_VERSION = "2022-11-28";
  private readonly AUTH_HEADER = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${process.env.GH_RHDH_QE_USER_TOKEN}`,
    "X-GitHub-Api-Version": this.API_VERSION,
  };

  public async getOrganization(
    org = JANUS_ORG,
  ): Promise<getOrganizationResponse> {
    const req = await this._organization(org).get();
    return new getOrganizationResponse(req.json());
  }

  public async getReposFromOrg(org = JANUS_ORG) {
    const req = await this._organization(org).repos();
    return req.json();
  }

  public async fileExistsOnRepo(repo: string, file: string): Promise<boolean> {
    const req = await this._repo(repo).getContent(file);
    const status = req.status();
    if (status == 403) {
      throw Error("You don-t have permissions to see this path");
    }
    return [200, 302, 304].includes(status);
  }

  private _myContext = request.newContext({
    baseURL: this.API_URL,
    extraHTTPHeaders: this.AUTH_HEADER,
  });

  private _repo(repo: string) {
    const url = `/repos/${repo}/`;
    return {
      getContent: async (path: string) => {
        path = url + path;
        const context = await this._myContext;
        return context.get(path);
      },
    };
  }

  private _organization(organization: string) {
    const url = "/orgs/";

    return {
      get: async (): Promise<APIResponse> => {
        const path: string = url + organization;
        const context = await this._myContext;
        return context.get(path);
      },

      repos: async (): Promise<APIResponse> => {
        const context = await this._myContext;
        const organizationResponse = await new GithubApi()
          ._organization(organization)
          .get();
        return context.get((await organizationResponse.json()).repos_url);
      },
    };
  }
}
