import axios, { AxiosResponse } from 'axios';
import { getOrganizationResponse } from './github-structures';
import { JANUS_ORG } from '../../utils/constants';

export default class GithubApi {
  private static API_URL = 'https://api.github.com';
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

  private myAxios = axios.create({
    baseURL: GithubApi.API_URL,
    headers: GithubApi.AUTH_HEADER,
  });

  private _organization(organization: string) {
    const url = '/orgs/';

    return {
      get: async (): Promise<AxiosResponse> => {
        const path: string = url + organization;
        return this.myAxios.get(path);
      },

      repos: async (): Promise<AxiosResponse> => {
        const organizationResponse = await new GithubApi()
          ._organization(organization)
          .get();
        return this.myAxios.get(organizationResponse.data['repos_url']);
      },
    };
  }
}
