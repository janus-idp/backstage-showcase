import { request, APIResponse } from '@playwright/test';

export class APIHelper {
  private static githubAPIVersion = '2022-11-28';

  static async githubRequest(
    method: string,
    url: string,
    body?: string | object,
  ): Promise<APIResponse> {
    const context = await request.newContext();
    const options = {
      method: method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${process.env.GH_RHDH_QE_USER_TOKEN}`,
        'X-GitHub-Api-Version': this.githubAPIVersion,
      },
    };

    if (body) {
      options['data'] = body;
    }

    const response = await context.fetch(url, options);
    return response;
  }

  static async getGithubPaginatedRequest(url, pageNo = 1, response = []) {
    const fullUrl = `${url}&page=${pageNo}`;
    const result = await this.githubRequest('GET', fullUrl);
    const body = await result.json();

    if (body.length === 0) {
      return response;
    }

    response = [...response, ...body];
    return await this.getGithubPaginatedRequest(url, pageNo + 1, response);
  }
}
