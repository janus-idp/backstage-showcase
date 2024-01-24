import fetch from 'node-fetch';
import User from './user';
import Group from './group';

interface AuthResponse {
  access_token: string;
}
class Keycloak {
  private readonly baseURL: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    this.baseURL = process.env.KEYCLOAK_BASE_URL;
    this.realm = process.env.KEYCLOAK_REALM;
    this.clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;
    this.clientId = process.env.KEYCLOAK_CLIENT_ID;
  }

  async getAuthenticationToken(): Promise<string> {
    const response = await fetch(
      `${this.baseURL}/realms/${this.realm}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }).toString(),
      },
    );

    if (response.status !== 200) throw new Error('Failed to authenticate');
    const data = (await response.json()) as AuthResponse;
    return data.access_token;
  }

  async getUsers(authToken: string): Promise<User[]> {
    const response = await fetch(
      `${this.baseURL}/admin/realms/${this.realm}/users`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    if (response.status !== 200) throw new Error('Failed to get users');
    return response.json() as Promise<User[]>;
  }

  async getGroupsOfUser(authToken: string, userId: string): Promise<Group[]> {
    const response = await fetch(
      `${this.baseURL}/admin/realms/${this.realm}/users/${userId}/groups`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    if (response.status !== 200)
      throw new Error('Failed to get groups of user');
    return response.json() as Promise<Group[]>;
  }
}

export default Keycloak;
