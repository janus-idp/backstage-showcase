import axios from 'axios';
import { env } from 'process';

export class getOrganizationResponse {
  reposUrl: string;
  constructor(response: any) {
    enum OrganizationResponseAttributes {
      reposUrl = 'repos_url',
    }
    this.reposUrl = response[OrganizationResponseAttributes.reposUrl];
  }
}

export class GithubApi {
  private static ApiUrl: string = 'https://api.github.com/';

  public organization(organization = env.GITHUB_ORG) {
    const endpoint = 'orgs/';

    return {
      async get(): Promise<getOrganizationResponse> {
        const path: string = `${GithubApi.ApiUrl}${endpoint}${organization}`;
        const response = await axios.get(path);
        return new getOrganizationResponse(response.data);
      },

      async repos() {
        const organizationResponse: getOrganizationResponse =
          await new GithubApi().organization(organization).get();
        const response = await axios.get(organizationResponse.reposUrl);
        return response.data;
      },
    };
  }
}
