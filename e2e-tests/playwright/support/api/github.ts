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
  public static URL = 'https://github.com/';
  private static API_URL = 'https://api.github.com/';
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
      pullRequests: async (
        pageNo: false | number = false,
        state = PRStatus.open,
        perPage = 100,
        response: any[] = [],
      ) => {
        if (pageNo) {
          const payload = `/pulls?per_page=${perPage}&state=${state}&page=${pageNo}`;

          const responseData = (await this.myAxios.get(payload)).data;

          if (responseData.length === 0) {
            return response;
          }

          return await this.repository().pullRequests(
            pageNo + 1,
            state,
            perPage,
            [...response, ...responseData],
          );
        } else {
          const payload = `/pulls?per_page=${perPage}&state=${state}`;

          const url = path + payload;

          const reqResponse = await this.myAxios.get(url);

          return reqResponse.data;
        }
      },
      issues: async (
        pageNo: false | number = false,
        state: PRStatus = PRStatus.open,
        perPage = 100,
        sort = 'updated',
        response: any[] = [],
      ) => {
        if (pageNo) {
          const payload = `/issues?per_page=${perPage}&sort=${sort}&state=${state}&page=${pageNo}`;
          const responseData = (await this.myAxios.get(payload)).data;
          if (responseData.length === 0) {
            return response;
          }
          response = [...response, ...responseData];
          return await this.repository().issues(
            pageNo + 1,
            state,
            perPage,
            sort,
            response,
          );
        } else {
          const payload = `/issues?per_page=${perPage}&sort=${sort}&state=${state}`;
          const url = path + payload;
          const myResponse = await this.myAxios.get(url);
          return myResponse.data;
        }
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
