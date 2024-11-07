export class GetOrganizationResponse {
  reposUrl: string;

  constructor(response: unknown) {
    enum OrganizationResponseAttributes {
      ReposUrl = "repos_url",
    }
    this.reposUrl = response[OrganizationResponseAttributes.ReposUrl];
  }
}

export enum ItemStatus {
  open = "open",
  closed = "closed",
  all = "all",
}
