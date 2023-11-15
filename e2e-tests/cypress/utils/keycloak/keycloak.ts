import User from './user';
import Group from './group';

class Keycloak {
  private readonly baseURL: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    this.baseURL = Cypress.env('KEYCLOAK_URL');
    this.realm = Cypress.env('KEYCLOAK_REALM');
    this.clientSecret = Cypress.env('KEYCLOAK_CLIENT_SECRET');
    this.clientId = Cypress.env('KEYCLOAK_CLIENT_ID');
  }

  getAuthenticationToken(): Cypress.Chainable<string> {
    return cy
      .request({
        method: 'POST',
        url: `${this.baseURL}/realms/${this.realm}/protocol/openid-connect/token`,
        form: true, // Define o cabeçalho Content-Type como 'application/x-www-form-urlencoded'
        body: {
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        },
      })
      .then(response => {
        expect(response.status).to.equal(200);
        return response.body.access_token;
      });
  }

  getUsers(authToken: string): Cypress.Chainable<User[]> {
    return cy
      .request({
        method: 'GET',
        url: `${this.baseURL}/admin/realms/${this.realm}/users`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      .then(response => {
        expect(response.status).to.equal(200);
        return response.body as User[];
      });
  }

  getGroupsOfUser(
    authToken: string,
    userId: string,
  ): Cypress.Chainable<Group[]> {
    return cy
      .request({
        method: 'GET',
        url: `${this.baseURL}/admin/realms/${this.realm}/users/${userId}/groups`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      .then(response => {
        expect(response.status).to.equal(200);
        return response.body as Group[];
      });
  }
}

export default Keycloak;
