import axios, { AxiosResponse } from 'axios';
import { getOrganizationResponse, PRStatus } from './github_structures';
import { JANUS_ORG, SHOWCASE_REPO } from '../../utils/constants';

export default class GithubApi {
  private static API_URL = 'https://api.github.com/';
  private static API_VERSION = '2022-11-28';
  private static AUTH_HEADER = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${process.env.GH_RHDH_QE_USER_TOKEN}`,
    'X-GitHub-Api-Version': GithubApi.API_VERSION,
  };

  public async getOrganization(
    org = JANUS_ORG,
  ): Promise<getOrganizationResponse> {
    const req = await this._organization(org).get();
    return new getOrganizationResponse(req.data);
  }

  public async getReposFromOrg(org = JANUS_ORG) {
    const req = await this._organization(org).repos();
    return req.data;
  }

  public async getPullRequestsFromRepo(
    prStatus: PRStatus,
    repo = SHOWCASE_REPO,
  ) {
    const req = await this._repository(repo).pullRequests();
    return req.data;
  }

  public async getIssuesFromRepo(repo = SHOWCASE_REPO) {
    const req = await this._repository(repo).issues();
    return req.data;
  }

  public async deleteRepo(repo = SHOWCASE_REPO) {
    const req = await this._repository(repo).detelete();
    return req.data;
  }

  public async getRunsFromAction(repo = SHOWCASE_REPO) {
    const req = await this._repository(repo).actions().runs();
    return req.data;
  }

  private myAxios = axios.create({
    baseURL: GithubApi.API_URL,
    headers: GithubApi.AUTH_HEADER,
  });

  private _organization(organization: string) {
    const url = 'orgs/';

    return {
      get: async (): Promise<AxiosResponse> => {
        const path: string = url + organization;
        return this.myAxios.get(path);
      },

      repos: async (): Promise<AxiosResponse> => {
        const organizationResponse = await new GithubApi()
          ._organization(organization)
          .get();
        return this.myAxios.get(organizationResponse['repos_url']);
      },
    };
  }

  private _repository(repo: string) {
    const path = 'repos/' + repo;

    return {
      pullRequests: async (
        state: PRStatus,
        perPage: number,
      ): Promise<AxiosResponse> => {
        const payload = `/pulls?per_page=${perPage}&state=${state}`;
        return this.myAxios.get(path + payload);
      },

      issues: async (
        state: PRStatus = PRStatus.open,
        perPage = 100,
        sort = 'updated',
      ) => {
        const payload = `/issues?per_page=${perPage}&sort=${sort}&state=${state}`;
        const url = path + payload;
        const myResponse = await this.myAxios.get(url);
        return myResponse.data;
      },
      detelete: async () => {
        const response = await this.myAxios.delete(path);
        return response.data;
      },
      actions() {
        const actionsPath = 'actions/';
        return {
          runs: async (perPage = 100) => {
            const runsPath = actionsPath + 'runs/';
            const url = runsPath + `?per_page=${perPage}`;
            const response = await this.myAxios.get(url);
            return response.data;
          },
        };
      },
    };
  }
}
