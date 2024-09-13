import { expect } from '@playwright/test';
import axios from 'axios';

export class RhdhApi {
  private myAxios = axios.create({
    baseURL: process.env.BASE_URL + '/api/',
  });

  private async getGuestToken() {
    const req = await this.myAxios.post('auth/guest/refresh');
    expect(req.status).toBe(200);
    return req.data.backstageIdentity.token;
  }

  public auth() {
    return {
      getGuestAuthHeader: async () => {
        const token = this.getGuestToken();
        const headers = {
          Authorization: `Bearer ${token}`,
        };
        return headers;
      },
    };
  }
}
