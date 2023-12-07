export class APIHelper {
  private static githubAPIVersion = '2022-11-28';

  static githubRequest(
    method: Cypress.HttpMethod,
    url: string,
    body?: Cypress.RequestBody,
  ) {
    const options = {
      method: method,
      url: url,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${Cypress.env('GH_RHDH_QE_USER_TOKEN')}`,
        'X-GitHub-Api-Version': this.githubAPIVersion,
      },
    };
    if (body) {
      options['body'] = body;
    }
    return cy.request(options);
  }

  static getGithubPaginatedRequest(url: string, pageNo = 1, response = []) {
    return APIHelper.githubRequest('GET', `${url}&page=${pageNo}`)
      .its('body')
      .then(body => {
        if (!body.length) {
          return cy.wrap(response);
        }
        response = response.concat(body);
        this.getGithubPaginatedRequest(url, pageNo + 1, response);
      });
  }
}
