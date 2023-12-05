import { CatalogUsersPO } from '../../../support/pageObjects/catalog/catalog-users-obj';
import Keycloak from '../../../utils/keycloak/keycloak';
import User from '../../../utils/keycloak/user';
import Group from '../../../utils/keycloak/group';
import { UIhelper } from '../../../utils/UIhelper';
import { Common } from '../../../utils/Common';

let keycloak: Keycloak;

describe('Test Keycloak plugin', () => {
  before(() => {
    Common.loginAsGuest();
    keycloak = new Keycloak();
    CatalogUsersPO.visitBaseURL();
  });
  it('Users on keycloak should match users on backstage', () => {
    keycloak.getAuthenticationToken().then(token => {
      const backStageUsersFound: User[] = [];

      keycloak.getUsers(token).then((keycloakUsers: User[]) => {
        CatalogUsersPO.getListOfUsers().then(backStageUsers => {
          backStageUsers.each((index, backStageUser) => {
            const userFound = keycloakUsers.find(
              user => user.username === backStageUser.textContent,
            );
            if (userFound) {
              backStageUsersFound.push(userFound);
            }
          });

          expect(keycloakUsers.length).to.eq(backStageUsersFound.length);

          backStageUsersFound.forEach((backStageUser, index) => {
            checkUserDetails(keycloakUsers[index], token);
          });
        });
      });
    });
  });

  const checkUserDetails = (keycloakUser: User, token: string) => {
    CatalogUsersPO.visitUserPage(keycloakUser.username);
    CatalogUsersPO.getEmailLink().should('be.visible');
    UIhelper.verifyDivHasText(
      `${keycloakUser.firstName} ${keycloakUser.lastName}`,
    );

    keycloak.getGroupsOfUser(token, keycloakUser.id).then((groups: Group[]) => {
      groups.forEach(group => {
        CatalogUsersPO.getGroupLink(group.name).should('be.visible');
      });
    });

    CatalogUsersPO.visitBaseURL();
  };
});
