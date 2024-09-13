import axios from 'axios';
import { env } from 'process';

export class getOrganizationResponse {
  reposUrl: string;
  constructor(response: any) {
    enum OrganizationResponseAttributes {
      ReposUrl = 'repos_url',
    }
    this.reposUrl = response[OrganizationResponseAttributes.ReposUrl];
  }
}

export enum PRStatus {
  open = 'open',
  closed = 'closed',
  all = 'all',
}

export class GithubApi {
  private static API_URL: string = 'https://api.github.com/';
  private static API_VERSION = '2022-11-28';
  private static AUTH_HEADER = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${process.env.GH_RHDH_QE_USER_TOKEN}`,
    'X-GitHub-Api-Version': GithubApi.API_VERSION,
  };

  private myAxios = axios.create({
    baseURL: GithubApi.API_URL,
    headers: GithubApi.AUTH_HEADER,
  });

  public organization(organization = env.GITHUB_ORG) {
    const url = 'orgs/';

    return {
      get: async (): Promise<getOrganizationResponse> => {
        const path: string = url + organization;
        const response = await this.myAxios.get(path);
        return new getOrganizationResponse(response.data);
      },

      repos: async () => {
        const organizationResponse: getOrganizationResponse =
          await new GithubApi().organization(organization).get();
        const response = await this.myAxios.get(organizationResponse.reposUrl);
        return response.data;
      },
    };
  }
  public repository(repo = 'janus-idp/backstage-showcase') {
    const path = 'repos/' + repo;

    return {
      getPullRequests: async (state: PRStatus, perPage = 100) => {
        const payload = `/pulls?per_page=${perPage}&state=${state}`;
        const url = path + payload;
        const response = await this.myAxios.get(url);
        return response.data;
      },
      getIssues: async (
        state: PRStatus,
        perPage = 100,
        sort = 'updated',
        paginated = -1,
      ) => {
        let payload = `/issues?per_page=${perPage}&sort=${sort}&state=${state}`;
        if (paginated > 0) payload += `&page=${paginated}`;

        const url = path + payload;
        const response = await this.myAxios.get(url);
        return response.data;
      },
      detelete: async () => {
        const response = await this.myAxios.delete(path);
        return response.data;
      },
      actions() {
        const actionsPath = 'actions/';
        return {
          runs: () => {
            const runsPath = actionsPath + 'runs/';
            return {
              get: async (perPage = 100) => {
                const url = runsPath + `?per_page=${perPage}`;
                const response = await this.myAxios.get(url);
                return response.data;
              },
            };
          },
        };
      },
    };
  }
}
