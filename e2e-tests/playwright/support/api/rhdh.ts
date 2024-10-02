import { request } from '@playwright/test';

export default class RhdhApi {
  private static API_URL = '/api/';

  private _myContext = request.newContext({
    baseURL: RhdhApi.API_URL,
  });

  private _search(query: string) {
    const url = 'search/query?' + query;
    return {
      getFullUrl: () => url,
    };
  }
}
