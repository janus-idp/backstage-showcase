import fetch, { RequestInit, Response } from 'node-fetch';

interface GithubItem {
  id: number;
  name: string;
}

export class APIHelper {
  private static githubAPIVersion = '2022-11-28';

  static async githubRequest(
    method: string,
    url: string,
    body?: any,
  ): Promise<Response> {
    const options: RequestInit = {
      method: method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${process.env.GH_RHDH_QE_USER_TOKEN}`,
        'X-GitHub-Api-Version': this.githubAPIVersion,
      },
    };
    if (body) {
      options.body = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }

  static async getGithubPaginatedRequest(
    url: string,
    pageNo = 1,
    responseAccumulator = [],
  ): Promise<any[]> {
    const fullUrl = `${url}&page=${pageNo}`;
    const res = await this.githubRequest('GET', fullUrl);
    const body = (await res.json()) as GithubItem[];

    if (!body.length) {
      return responseAccumulator;
    }

    responseAccumulator = responseAccumulator.concat(body);
    return this.getGithubPaginatedRequest(url, pageNo + 1, responseAccumulator);
  }
}
