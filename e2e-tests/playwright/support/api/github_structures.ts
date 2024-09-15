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
