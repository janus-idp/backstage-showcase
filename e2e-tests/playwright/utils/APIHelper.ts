export class APIHelper {
  static async getGithubPaginatedRequest(
    url: string,
    pageNo = 1,
    response: any[] = [],
  ): Promise<any[]> {
    const fullUrl = `${url}&page=${pageNo}`;
    const result = await this.githubRequest('GET', fullUrl);
    const body = await result.json();

    response = [...response, ...body];
    return await this.getGithubPaginatedRequest(url, pageNo + 1, response);
  }
}
