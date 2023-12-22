import { CatalogUsersPO } from '../../../support/pageObjects/catalog/catalog-users-obj';
import Keycloak from '../../../utils/keycloak/keycloak';
import { UIhelper } from '../../../utils/UIhelper';
import { Common } from '../../../utils/Common';
import { test, expect, Page } from '@playwright/test';
import User from '../../../utils/keycloak/user';

test.describe.skip('Test Keycloak plugin', () => {
  let uiHelper: UIhelper;
  let keycloak: Keycloak;

  test.beforeAll(async ({ page }) => {
    uiHelper = new UIhelper(page);
    const common = new Common(page);
    await common.loginAsGuest();
    keycloak = new Keycloak();
    await CatalogUsersPO.visitBaseURL(page);
  });

  test('Users on keycloak should match users on backstage', async ({
    page,
  }) => {
    const token = await keycloak.getAuthenticationToken();
    const keycloakUsers = await keycloak.getUsers(token);
    const backStageUsersLocator = await CatalogUsersPO.getListOfUsers(page); // Use await to resolve the Promise
    const backStageUsersCount = await backStageUsersLocator.count(); // Now you can call count()

    expect(keycloakUsers.length).toBe(backStageUsersCount);

    for (let i = 0; i < backStageUsersCount; i++) {
      const backStageUser = backStageUsersLocator.nth(i);
      const backStageUserText = await backStageUser.textContent();
      const userFound = keycloakUsers.find(
        user => user.username === backStageUserText,
      );
      expect(userFound).not.toBeNull();

      if (userFound) {
        await checkUserDetails(page, userFound, token);
      }
    }
  });

  async function checkUserDetails(
    page: Page,
    keycloakUser: User,
    token: string,
  ) {
    await CatalogUsersPO.visitUserPage(page, keycloakUser.username);
    const emailLink = await CatalogUsersPO.getEmailLink(page);
    await expect(emailLink).toBeVisible();
    await uiHelper.verifyDivHasText(
      `${keycloakUser.firstName} ${keycloakUser.lastName}`,
    );

    const groups = await keycloak.getGroupsOfUser(token, keycloakUser.id);
    for (const group of groups) {
      const groupLink = await CatalogUsersPO.getGroupLink(page, group.name);
      await expect(groupLink).toBeVisible();
    }

    await CatalogUsersPO.visitBaseURL(page);
  }
});
