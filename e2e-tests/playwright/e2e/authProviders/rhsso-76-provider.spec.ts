import { test, Page, expect } from "@playwright/test";
import { Common, setupBrowser } from "../../utils/Common";
import { UIhelper } from "../../utils/UIhelper";
import UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation";
import * as constants from "../../utils/authenticationProviders/constants";
import { logger } from "../../utils/Logger";
import GroupRepresentation from "@keycloak/keycloak-admin-client/lib/defs/groupRepresentation";
import {
  upgradeHelmChartWithWait,
  WaitForNextSync,
  replaceInRBACPolicyFileConfigMap,
  dumpAllPodsLogs,
  dumpRHDHUsersAndGroups,
} from "../../utils/helper";
import { RHSSOHelper } from "../../utils/authenticationProviders/rhssoHelper";
import { APIHelper } from "../../utils/APIHelper";
import { GroupEntity } from "@backstage/catalog-model";
import { RhdhAuthHack } from "../../support/api/rhdh-auth-hack";

let page: Page;

test.describe("Standard authentication providers: OIDC with RHSSO 7.6", () => {
  test.use({ baseURL: constants.AUTH_PROVIDERS_BASE_URL });

  let common: Common;
  let uiHelper: UIhelper;
  let usersCreated: Map<string, UserRepresentation>;
  let groupsCreated: Map<string, GroupRepresentation>;
  const SYNC__TIME = 60;
  let rhssoHelper: RHSSOHelper;

  test.beforeAll(async ({ browser }, testInfo) => {
    test.setTimeout(120 * 1000);
    logger.info(
      `Staring scenario: Standard authentication providers: OIDC with RHSSO 7.6: attemp #${testInfo.retry}`,
    );
    expect(constants.RHSSO76_ADMIN_USERNAME).not.toBeNull();
    expect(constants.RHSSO76_ADMIN_PASSWORD).not.toBeNull();
    expect(constants.RHSSO76_DEFAULT_PASSWORD).not.toBeNull();
    expect(constants.RHSSO76_URL).not.toBeNull();
    expect(constants.RHSSO76_CLIENT_SECRET).not.toBeNull();
    expect(constants.RHSSO76_CLIENTID).not.toBeNull();
    expect(constants.AUTH_PROVIDERS_REALM_NAME).not.toBeNull();
    expect(constants.RHSSO76_GROUPS).not.toBeNull();
    expect(constants.RHSSO76_NESTED_GROUP).not.toBeNull();
    expect(constants.RHSSO76_USERS).not.toBeNull();

    expect(constants.AUTH_PROVIDERS_BASE_URL).not.toBeNull();
    expect(constants.AUTH_PROVIDERS_NAMESPACE).not.toBeNull();
    expect(constants.AUTH_PROVIDERS_RELEASE).not.toBeNull();
    expect(constants.AUTH_PROVIDERS_CHART).not.toBeNull();
    expect(constants.CHART_VERSION).not.toBeNull();
    expect(constants.QUAY_REPO).not.toBeNull();
    expect(constants.TAG_NAME).not.toBeNull();
    expect(constants.AUTH_PROVIDERS_VALUES_FILE).not.toBeNull();
    expect(constants.AUTH_PROVIDERS_CHART).not.toBeNull();
    expect(constants.RBAC_POLICY_ROLES).not.toBeNull();

    logger.info(`Base Url is ${process.env.BASE_URL}`);

    page = (await setupBrowser(browser, testInfo)).page;
    common = new Common(page);
    uiHelper = new UIhelper(page);

    rhssoHelper = new RHSSOHelper("7.6");
    await rhssoHelper.initializeRHSSOClient();
    const created = await rhssoHelper.setupRHSSOEnvironment();
    usersCreated = created.usersCreated;
    groupsCreated = created.groupsCreated;
  });

  test("Default resolver for RHSSO should be emailLocalPartMatchingUserEntityName: user_1 should authenticate, user_2 should not", async () => {
    test.setTimeout(600 * 1000);

    logger.info(
      `Executing testcase: Default resolver for RHSSO should be emailLocalPartMatchingUserEntityName: user_1 should authenticate, user_2 should not`,
    );
    // setup RHSSO provider with user ingestion
    await upgradeHelmChartWithWait(
      constants.AUTH_PROVIDERS_RELEASE,
      constants.AUTH_PROVIDERS_CHART,
      constants.AUTH_PROVIDERS_NAMESPACE,
      constants.AUTH_PROVIDERS_VALUES_FILE,
      constants.CHART_VERSION,
      constants.QUAY_REPO,
      constants.TAG_NAME,
      [
        "--set global.dynamic.plugins[0].disabled=false",
        "--set upstream.postgresql.primary.persistence.enabled=false",
        "--set upstream.backstage.appConfig.catalog.providers.githubOrg=null",
        "--set upstream.backstage.appConfig.catalog.providers.microsoftOrg=null",
        "--set global.dynamic.plugins[3].disabled=false",
        "--set upstream.backstage.appConfig.permission.enabled=true",
        "--set upstream.backstage.appConfig.auth.providers.oidc.production.callbackUrl=${RHSSO76_CALLBACK_URL}",
      ],
    );

    await WaitForNextSync(SYNC__TIME, "rhsso");

    await common.keycloakLogin(
      constants.RHSSO76_USERS["user_1"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await uiHelper.openSidebar("Settings");
    await uiHelper.verifyHeading(
      await rhssoHelper.getRHSSOUserDisplayName(
        constants.RHSSO76_USERS["user_1"],
      ),
    );
    await common.signOut();

    await common.keycloakLogin(
      constants.RHSSO76_USERS["user_2"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await uiHelper.verifyAlertErrorMessage(
      "Login failed; caused by NotFoundError: User not found",
    );

    await rhssoHelper.clearUserSessions(
      constants.RHSSO76_USERS["user_2"].username,
      constants.AUTH_PROVIDERS_REALM_NAME,
    );
  });

  test("Testing resolver emailMatchingUserEntityProfileEmail: user_1 should authenticate, jdoe should not", async () => {
    test.setTimeout(600 * 1000);
    logger.info(
      "Executing testcase: Testing resolver emailMatchingUserEntityProfileEmail: user_1 should authenticate, jdoe should not",
    );
    // updating the resolver
    // disable keycloak plugin to disable ingestion
    // edit jdoe user in keycloak to have a different email than the synced one: it will not be synced

    await upgradeHelmChartWithWait(
      constants.AUTH_PROVIDERS_RELEASE,
      constants.AUTH_PROVIDERS_CHART,
      constants.AUTH_PROVIDERS_NAMESPACE,
      constants.AUTH_PROVIDERS_VALUES_FILE,
      constants.CHART_VERSION,
      constants.QUAY_REPO,
      constants.TAG_NAME,
      [
        "--set global.dynamic.plugins[0].disabled=false",
        "--set global.dynamic.plugins[1].disabled=true",
        "--set global.dynamic.plugins[2].disabled=true",
        "--set upstream.postgresql.primary.persistence.enabled=false",
        "--set upstream.backstage.appConfig.auth.providers.oidc.production.signIn.resolvers[0].resolver=emailMatchingUserEntityProfileEmail",
        "--set global.dynamic.plugins[3].disabled=false",
        "--set upstream.backstage.appConfig.permission.enabled=true",
        "--set upstream.backstage.appConfig.auth.providers.oidc.production.callbackUrl=${RHSSO76_CALLBACK_URL}",
      ],
    );

    await WaitForNextSync(SYNC__TIME, "rhsso");

    // emailMatchingUserEntityProfileEmail should only allow authentication of keycloak users that match the email attribute with the entity one.
    // update jdoe email -> login should fail with error Login failed; caused by Error: Failed to sign-in, unable to resolve user identity
    await rhssoHelper.updateUserEmail(
      constants.RHSSO76_USERS["jenny_doe"].username,
      constants.JDOE_NEW_EMAIL,
    );

    // login with testuser1 -> login should succeed
    await common.keycloakLogin(
      constants.RHSSO76_USERS["user_1"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await uiHelper.openSidebar("Settings");
    await uiHelper.verifyHeading(
      await rhssoHelper.getRHSSOUserDisplayName(
        constants.RHSSO76_USERS["user_1"],
      ),
    );
    await common.signOut();

    // login with jenny doe -> should fail
    await common.keycloakLogin(
      constants.RHSSO76_USERS["jenny_doe"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await uiHelper.verifyAlertErrorMessage(
      "Login failed; caused by Error: Failed to sign-in, unable to resolve user identity",
    );
    await rhssoHelper.clearUserSessions(
      constants.RHSSO76_USERS["jenny_doe"].username,
      constants.AUTH_PROVIDERS_REALM_NAME,
    );
  });

  test("Testing resolver preferredUsernameMatchingUserEntityName: user_1 and jenny_doe should both authenticate", async () => {
    test.setTimeout(600 * 1000);
    logger.info(
      "Executing testcase: Testing resolver preferredUsernameMatchingUserEntityName: user_1 and jenny_doe should both authenticate",
    );
    // updating the resolver
    // disable keycloak plugin to disable ingestion

    await upgradeHelmChartWithWait(
      constants.AUTH_PROVIDERS_RELEASE,
      constants.AUTH_PROVIDERS_CHART,
      constants.AUTH_PROVIDERS_NAMESPACE,
      constants.AUTH_PROVIDERS_VALUES_FILE,
      constants.CHART_VERSION,
      constants.QUAY_REPO,
      constants.TAG_NAME,
      [
        "--set global.dynamic.plugins[0].disabled=false",
        "--set global.dynamic.plugins[1].disabled=true",
        "--set global.dynamic.plugins[2].disabled=true",
        "--set upstream.postgresql.primary.persistence.enabled=false",
        "--set upstream.backstage.appConfig.auth.providers.oidc.production.signIn.resolvers[0].resolver=preferredUsernameMatchingUserEntityName",
        "--set global.dynamic.plugins[3].disabled=false",
        "--set upstream.backstage.appConfig.permission.enabled=true",
        "--set upstream.backstage.appConfig.auth.providers.oidc.production.callbackUrl=${RHSSO76_CALLBACK_URL}",
      ],
    );

    // preferredUsernameMatchingUserEntityName should allow authentication of any keycloak.

    await WaitForNextSync(SYNC__TIME, "rhsso");

    // login with testuser1 -> login should succeed
    await common.keycloakLogin(
      constants.RHSSO76_USERS["user_1"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await uiHelper.openSidebar("Settings");
    await uiHelper.verifyHeading(
      rhssoHelper.getRHSSOUserDisplayName(constants.RHSSO76_USERS["user_1"]),
    );
    await common.signOut();

    // login with jenny doe -> should succeed
    await common.keycloakLogin(
      constants.RHSSO76_USERS["jenny_doe"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await uiHelper.openSidebar("Settings");
    await uiHelper.verifyHeading(
      rhssoHelper.getRHSSOUserDisplayName(constants.RHSSO76_USERS["jenny_doe"]),
    );
    await common.signOut();

    // login with user_2 -> should succeed
    await common.keycloakLogin(
      constants.RHSSO76_USERS["user_2"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await uiHelper.openSidebar("Settings");
    await uiHelper.verifyHeading(
      rhssoHelper.getRHSSOUserDisplayName(constants.RHSSO76_USERS["user_2"]),
    );
    await common.signOut();
  });

  test("Ingestion of Users and Nested Groups: verify the UserEntities and Groups are created with the correct relationships in RHDH", async () => {
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC__TIME, "rhsso");
    }

    // check users are in the catalog
    const usersDisplayNames = Object.values(constants.RHSSO76_USERS).map((u) =>
      rhssoHelper.getRHSSOUserDisplayName(u),
    );

    expect(await common.CheckUserIsIngestedInCatalog(usersDisplayNames)).toBe(
      true,
    );

    // check groups are in the catalog
    const groupsDisplayNames = Object.values(constants.RHSSO76_GROUPS).map(
      (g) => g.name,
    );
    groupsDisplayNames.push(constants.RHSSO76_NESTED_GROUP.name);
    expect(await common.CheckGroupIsIngestedInCatalog(groupsDisplayNames)).toBe(
      true,
    );

    const api = new APIHelper();
    api.UseStaticToken(constants.STATIC_API_TOKEN);

    // group_1 should show user_1
    const group_1: GroupEntity = await api.getGroupEntityFromAPI(
      constants.RHSSO76_GROUPS["group_1"].name,
    );
    expect(
      group_1.spec.members.includes(constants.RHSSO76_USERS["user_1"].username),
    ).toBe(true);

    // group_2 should show user_2 and parent group_nested
    const group_2: GroupEntity = await api.getGroupEntityFromAPI(
      constants.RHSSO76_GROUPS["group_2"].name,
    );

    expect(
      group_2.spec.members.includes(constants.RHSSO76_USERS["user_2"].username),
    ).toBe(true);
    expect(
      group_2.spec.children.includes(constants.RHSSO76_NESTED_GROUP.name),
    ).toBe(true);

    // group_nested should show user_3
    const group_3: GroupEntity = await api.getGroupEntityFromAPI(
      constants.RHSSO76_NESTED_GROUP.name,
    );

    expect(
      group_3.spec.members.includes(constants.RHSSO76_USERS["user_3"].username),
    ).toBe(true);

    // group_4 should show user_3
    const group_4: GroupEntity = await api.getGroupEntityFromAPI(
      constants.RHSSO76_GROUPS["group_4"].name,
    );

    expect(
      group_4.spec.members.includes(constants.RHSSO76_USERS["user_3"].username),
    ).toBe(true);

    expect(
      group_4.spec.members.includes(constants.RHSSO76_USERS["user_4"].username),
    ).toBe(true);
  });

  test("Remove user from RHSSO", async () => {
    test.setTimeout(300 * 1000);

    logger.info(`Executing testcase: Remove user from RHSSO`);
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC__TIME, "rhsso");
    }
    await rhssoHelper.deleteUser(usersCreated["user_1"].id);
    await page.waitForTimeout(2000); // give rhsso a few seconds
    await common.keycloakLogin(
      constants.RHSSO76_USERS["user_1"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    await uiHelper.verifyAlertErrorMessage(/Login failed/gm);

    await WaitForNextSync(SYNC__TIME, "rhsso");

    expect(
      await common.CheckUserIsIngestedInCatalog([
        constants.RHSSO76_USERS["user_1"].username,
      ]),
    ).toBe(false);

    const api = new APIHelper();
    api.UseStaticToken(constants.STATIC_API_TOKEN);

    const group_1: GroupEntity = await api.getGroupEntityFromAPI(
      constants.RHSSO76_GROUPS["group_1"].name,
    );
    expect(
      group_1.spec.members.includes(constants.RHSSO76_USERS["user_1"].username),
    ).toBe(false);
  });

  test("Move a user to another group in RHSSO", async () => {
    test.setTimeout(300 * 1000);
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC__TIME, "rhsso");
    }
    // move a user to another group -> ensure user can still login
    // move user_3 to group_3
    logger.info(
      `Executing testcase: Move a user to another group in Microsoft EntraID: user should still login before next sync.`,
    );

    await rhssoHelper.removeUserFromGroup(
      usersCreated["user_3"].id,
      groupsCreated["group_4"].id,
    );
    await rhssoHelper.addUserToGroup(
      usersCreated["user_3"].id,
      groupsCreated["location_admin"].id,
    );
    await common.keycloakLogin(
      constants.RHSSO76_USERS["user_3"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    let apiToken = await RhdhAuthHack.getInstance().getApiToken(page);
    const api = new APIHelper();
    api.UseStaticToken(constants.STATIC_API_TOKEN);

    const statusBefore = await api.scheduleEntityRefreshFromAPI(
      "example",
      "location",
      apiToken,
    );
    logger.info(
      `Checking user can schedule location refresh. API returned ${JSON.stringify(statusBefore)}`,
    );
    expect(statusBefore).toBe(403);

    // logout
    await page.goto("/");
    await uiHelper.openSidebar("Settings");
    await common.signOut();

    await WaitForNextSync(SYNC__TIME, "rhsso");

    // ensure the change is mirrored in the catalog
    logger.info(
      `Execute testcase: Move a user to another group in RHSSO: change should be mirrored and permission should be updated after the sync`,
    );

    // location_admin should show user_3
    const group_3: GroupEntity = await api.getGroupEntityFromAPI(
      constants.RHSSO76_GROUPS["location_admin"].name,
    );

    expect(
      group_3.spec.members.includes(constants.RHSSO76_USERS["user_3"].username),
    ).toBe(true);

    // configure policy permissions different for the two groups
    // after the sync, ensure the permission also reflect the user move
    await common.keycloakLogin(
      constants.RHSSO76_USERS["user_3"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    // check RBAC permissions are updated after group update
    // new group should allow user to schedule location refresh and unregister the entity
    apiToken = await RhdhAuthHack.getInstance().getApiToken(page);
    const statusAfter = await api.scheduleEntityRefreshFromAPI(
      "example",
      "location",
      apiToken,
    );
    logger.info(
      `Checking user can schedule location refresh. API returned ${statusAfter}`,
    );
    expect(statusAfter).toBe(200);

    await page.goto("/");
    await uiHelper.openSidebar("Settings");
    await common.signOut();
  });

  test("Remove a group from RHSSO", async () => {
    test.setTimeout(300 * 1000);
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC__TIME, "rhsso");
    }
    // remove a group -> ensure group and its members still exists, member should still login
    // remove group_3
    logger.info(
      `Executing testcase: Remove a group from RHSSO: ensure group and its members still exists, member should still login before next sync.`,
    );

    await rhssoHelper.deleteGroup(groupsCreated["group_4"].id);

    // user_4 should login
    await common.keycloakLogin(
      constants.RHSSO76_USERS["user_4"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    await uiHelper.openSidebar("Settings");
    await common.signOut();

    // group_4 should exist in rhdh
    const api = new APIHelper();
    api.UseStaticToken(constants.STATIC_API_TOKEN);

    const group_4: GroupEntity = await api.getGroupEntityFromAPI(
      constants.RHSSO76_GROUPS["group_4"].name,
    );
    expect(
      group_4.spec.members.includes(constants.RHSSO76_USERS["user_4"].username),
    ).toBe(true);

    // waiting for next sync
    await WaitForNextSync(SYNC__TIME, "rhsso");

    // after the sync ensure the group entity is removed
    logger.info(
      `Execute testcase: Remove a group from RHSSO: group should be removed and permissions should default to read-only after the sync.`,
    );

    // group_4 should not be in the catalog anymore
    expect(
      await common.CheckGroupIsIngestedInCatalog([
        constants.RHSSO76_GROUPS["group_4"].name,
      ]),
    ).toBe(false);

    // users permission based on that group will be defaulted to read-only
    // expect user not to see catalog entities
    await common.keycloakLogin(
      constants.RHSSO76_USERS["user_4"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await page.goto("/");
    const navMyGroup = page.locator(`nav a:has-text("My Group")`);
    await expect(navMyGroup).toHaveCount(0);

    await page.goto("/");
    await uiHelper.openSidebar("Settings");
    await common.signOut();
  });

  test("Remove a user from RHDH", async () => {
    test.setTimeout(300 * 1000);

    // remove user from RHDH -> authentication works, access is broken
    logger.info(
      `Executing testcase: Remove a user from RHDH: authentication should work, but access is denied before next sync.`,
    );
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC__TIME, "rhsso");
    }

    await common.UnregisterUserEntityFromCatalog(
      constants.RHSSO76_USERS["user_4"].username,
    );

    await expect(async () => {}).toPass({
      intervals: [1_000, 2_000, 5_000],
      timeout: 20 * 1000,
    });

    // expect entity is not found in rhdh
    const loginSucceded = await common.keycloakLogin(
      constants.RHSSO76_USERS["user_4"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    expect(loginSucceded).toContain("Login successful");

    await uiHelper.verifyAlertErrorMessage(
      /Login failed; caused by Error: Failed to sign-in, unable to resolve user identity/gm,
    );

    // clear user sessions
    await rhssoHelper.clearUserSessions(
      constants.RHSSO76_USERS["user_4"].username,
      constants.AUTH_PROVIDERS_REALM_NAME,
    );

    await WaitForNextSync(SYNC__TIME, "rhsso");

    logger.info(
      `Execute testcase: Remove a user from RHDH: user is re-created and can login after the sync`,
    );
    // user_4 should login
    await common.keycloakLogin(
      constants.RHSSO76_USERS["user_4"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    await page.goto("/");
    await uiHelper.openSidebar("Settings");
    await common.signOut();
  });

  test("Remove a group from RHDH", async () => {
    test.setTimeout(300 * 1000);

    // remove group from RHDH -> user can login
    logger.info(
      `Executing testcase: Remove a group from RHDH: user can login.`,
    );
    if (test.info().retry >= 0) {
      await WaitForNextSync(SYNC__TIME, "rhsso");
    }

    await common.UnregisterGroupEntityFromCatalog(
      constants.RHSSO76_GROUPS["group_3"].name,
    );

    await expect(async () => {
      expect(
        await common.CheckGroupIsIngestedInCatalog([
          constants.RHSSO76_GROUPS["group_3"].name,
        ]),
      ).toBe(false);
    }).toPass({
      intervals: [1_000, 2_000, 5_000],
      timeout: 20 * 1000,
    });

    await WaitForNextSync(SYNC__TIME, "rhsso");

    // after sync, ensure group is created again and memembers can login
    logger.info(
      `Execute testcase: Remove a group from RHDH: group is created again after the sync`,
    );
    expect(
      await common.CheckGroupIsIngestedInCatalog([
        constants.RHSSO76_GROUPS["group_3"].name,
      ]),
    ).toBe(true);
  });

  test("Rename a user and a group", async () => {
    test.setTimeout(300 * 1000);
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC__TIME, "rhsso");
    }

    // rename group -> user can login, but policy is broken
    logger.info(`Executing testcase: Rename a user and a group.`);

    await rhssoHelper.updateUser(usersCreated["user_2"].id, {
      lastName: constants.RHSSO76_USERS["user_2"].lastName + " Renamed",
      emailVerified: true,
      email: constants.RHSSO76_USERS["user_2"].username + "@rhdh.com",
    });

    await rhssoHelper.updateGruop(groupsCreated["group_2"].id, {
      name: constants.RHSSO76_GROUPS["group_2"].name + "_renamed",
    });

    // waiting for next sync
    await WaitForNextSync(SYNC__TIME, "rhsso");

    // after sync, ensure group is mirrored
    // after sync, ensure user change is mirrorred
    logger.info(
      `Execute testcase: Rename a user and a group: changes are mirrored in RHDH but permissions should be broken after the sync`,
    );

    expect(
      await common.CheckGroupIsIngestedInCatalog([
        constants.RHSSO76_GROUPS["group_2"].name + "_renamed",
      ]),
    ).toBe(true);

    await common.keycloakLogin(
      constants.RHSSO76_USERS["user_2"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    // users permission based on that group will be defaulted to read-only
    // expect user not to see catalog entities
    await page.goto("/");
    const navMyGroup = page.locator(`nav a:has-text("My Group")`);
    await expect(navMyGroup).toHaveCount(0);

    // update the policy with the new group name
    await replaceInRBACPolicyFileConfigMap(
      "rbac-policy",
      constants.AUTH_PROVIDERS_NAMESPACE,
      constants.RHSSO76_GROUPS["group_2"].name,
      constants.RHSSO76_GROUPS["group_2"].name + "_renamed",
    );

    await uiHelper.openSidebar("Settings");
    // user should see the entities again
    await expect(async () => {
      await page.reload();
      logger.info(
        "Reloading page, permission should be updated automatically.",
      );
      await expect(page.locator(`nav a:has-text("My Group")`)).toBeVisible({
        timeout: 2000,
      });
    }).toPass({
      intervals: [5_000, 10_000],
      timeout: 120 * 1000,
    });

    await uiHelper.openSidebar("My Group");
    await uiHelper.verifyHeading(
      constants.RHSSO76_GROUPS["group_2"].name + "_renamed",
    );

    await uiHelper.openSidebar("Settings");
    await common.signOut();
  });

  test.afterEach(async () => {
    if (test.info().status !== test.info().expectedStatus) {
      const prefix = `${test.info().testId}_${test.info().retry}`;
      logger.info(`Dumping logs with prefix ${prefix}`);
      await dumpAllPodsLogs(prefix);
      await dumpRHDHUsersAndGroups(prefix);
    }
  });
});
