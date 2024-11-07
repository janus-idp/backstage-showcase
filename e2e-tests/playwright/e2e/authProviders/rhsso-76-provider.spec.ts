import { test, Page, expect } from "@playwright/test";
import { Common, setupBrowser } from "../../utils/common";
import { UIhelper } from "../../utils/ui-helper";
import UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation";
import * as constants from "../../utils/authenticationProviders/constants";
import { LOGGER } from "../../utils/logger";
import GroupRepresentation from "@keycloak/keycloak-admin-client/lib/defs/groupRepresentation";
import {
  upgradeHelmChartWithWait,
  waitForNextSync,
  replaceInRBACPolicyFileConfigMap,
} from "../../utils/helper";
import * as rhssoHelper from "../../utils/authenticationProviders/rh-sso-helper";

let page: Page;

test.describe("Standard authentication providers: OIDC with RHSSO 7.6", () => {
  test.use({ baseURL: constants.AUTH_PROVIDERS_BASE_URL });

  let common: Common;
  let uiHelper: UIhelper;
  let usersCreated: Map<string, UserRepresentation>;
  let groupsCreated: Map<string, GroupRepresentation>;
  const syncTime = 60;

  test.beforeAll(async ({ browser }, testInfo) => {
    LOGGER.info(
      `Staring scenario: Standard authentication providers: OIDC with RHSSO 7.6: attemp #${testInfo.retry}`,
    );
    expect(process.env.BASE_URL).not.toBeNull();
    LOGGER.info(`Base Url is ${process.env.BASE_URL}`);

    page = (await setupBrowser(browser, testInfo)).page;
    common = new Common(page);
    uiHelper = new UIhelper(page);

    await rhssoHelper.initializeRHSSOClient(rhssoHelper.CONNECTION_CONFIG);
    const created = await rhssoHelper.setupRHSSOEnvironment();
    usersCreated = created.usersCreated;
    groupsCreated = created.groupsCreated;
  });

  test("Default resolver for RHSSO should be emailLocalPartMatchingUserEntityName: user_1 should authenticate, user_2 should not", async () => {
    test.setTimeout(600 * 1000);

    LOGGER.info(
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

    await waitForNextSync("rhsso", syncTime);

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
    LOGGER.info(
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

    await waitForNextSync("rhsso", syncTime);

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
    LOGGER.info(
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

    await waitForNextSync("rhsso", syncTime);

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
      await waitForNextSync("rhsso", syncTime);
    }
    await common.keycloakLogin(
      constants.RHSSO76_USERS["user_1"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    // check entities are in the catalog
    const usersDisplayNames = Object.values(constants.RHSSO76_USERS).map((u) =>
      rhssoHelper.getRHSSOUserDisplayName(u),
    );

    await common.CheckUserIsShowingInCatalog(usersDisplayNames);

    // check groups are nested correctly and display all members
    const groupsDisplayNames = Object.values(constants.RHSSO76_GROUPS).map(
      (g) => g.name,
    );
    groupsDisplayNames.push(constants.RHSSO76_NESTED_GROUP.name);
    await common.CheckGroupIsShowingInCatalog(groupsDisplayNames);

    let displayed;

    // group_1 should show user_1
    displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.RHSSO76_GROUPS["group_1"].name,
    );

    expect(displayed.groupMembers).toContain(
      rhssoHelper.getRHSSOUserDisplayName(constants.RHSSO76_USERS["user_1"]),
    );

    // group_2 should show user_2 and parent group_nested
    displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.RHSSO76_GROUPS["group_2"].name,
    );

    expect(displayed.groupMembers).toContain(
      rhssoHelper.getRHSSOUserDisplayName(constants.RHSSO76_USERS["user_2"]),
    );
    expect(displayed.childGroups).toContain(
      constants.RHSSO76_NESTED_GROUP.name,
    );

    // group_nested should show user_3
    displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.RHSSO76_NESTED_GROUP.name,
    );

    expect(displayed.groupMembers).toContain(
      rhssoHelper.getRHSSOUserDisplayName(constants.RHSSO76_USERS["user_3"]),
    );
    expect(displayed.parentGroup).toContain(
      constants.RHSSO76_GROUPS["group_2"].name,
    );

    // logout
    await uiHelper.openSidebar("Settings");
    await common.signOut();
  });

  test("Remove user from RHSSO", async () => {
    // remove user from azure -> ensure authentication fails
    test.setTimeout(300 * 1000);
    LOGGER.info(`Executing testcase: Remove user from RHSSO`);
    if (test.info().retry > 0) {
      await waitForNextSync("rhsso", syncTime);
    }
    await rhssoHelper.deleteUser(usersCreated["user_1"].id);
    await page.waitForTimeout(2000); // give rhsso a few seconds
    await common.keycloakLogin(
      constants.RHSSO76_USERS["user_1"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    await uiHelper.verifyAlertErrorMessage(/Login failed/gm);

    await waitForNextSync("rhsso", syncTime);

    await common.keycloakLogin(
      constants.RHSSO76_USERS["user_2"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    await expect(
      common.CheckUserIsShowingInCatalog([
        rhssoHelper.getRHSSOUserDisplayName(constants.RHSSO76_USERS["user_1"]),
      ]),
    ).rejects.toThrow();

    const displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.RHSSO76_GROUPS["group_1"].name,
    );
    expect(displayed.groupMembers).not.toContain(
      rhssoHelper.getRHSSOUserDisplayName(constants.RHSSO76_USERS["user_1"]),
    );
    await uiHelper.openSidebar("Settings");
    await common.signOut();
  });

  test("Move a user to another group in RHSSO", async () => {
    test.setTimeout(300 * 1000);
    if (test.info().retry > 0) {
      await waitForNextSync("rhsso", syncTime);
    }
    // move a user to another group -> ensure user can still login
    // move user_3 to group_3
    LOGGER.info(
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
    await page.goto("/");
    await uiHelper.openSidebar("Catalog");
    // submenu with groups opens randomly in headless mode, blocking visibility of the other elements
    await page.mouse.move(
      page.viewportSize().width / 2,
      page.viewportSize().height / 2,
    );
    await uiHelper.selectMuiBox("Kind", "Location");
    await uiHelper.verifyHeading("All locations");
    await uiHelper.verifyCellsInTable(["example"]);
    await uiHelper.clickLink("example");
    await uiHelper.verifyHeading("example");
    await expect(
      page.locator(`button[title="Schedule entity refresh"]`),
    ).toHaveCount(0);
    // logout
    await page.goto("/");
    await uiHelper.openSidebar("Settings");
    await common.signOut();

    await waitForNextSync("rhsso", syncTime);

    // ensure the change is mirrored in the catalog
    LOGGER.info(
      `Execute testcase: Move a user to another group in RHSSO: change should be mirrored and permission should be updated after the sync`,
    );
    await common.keycloakLogin(
      constants.RHSSO76_USERS["user_3"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    const displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.RHSSO76_GROUPS["location_admin"].name,
    );
    expect(displayed.groupMembers).toContain(
      rhssoHelper.getRHSSOUserDisplayName(constants.RHSSO76_USERS["user_3"]),
    );

    // configure policy permissions different for the two groups
    // after the sync, ensure the permission also reflect the user move
    // check RBAC permissions are updated after group update
    // new group should allow user to schedule location refresh and unregister the entity
    await page.goto("/");
    await uiHelper.openSidebar("Catalog");
    // submenu with groups opens randomly in headless mode, blocking visibility of the other elements
    await page.mouse.move(
      page.viewportSize().width / 2,
      page.viewportSize().height / 2,
    );

    await await uiHelper.verifyLocationRefreshButtonIsEnabled("example");

    await page.goto("/");
    await uiHelper.openSidebar("Settings");
    await common.signOut();
  });

  test("Remove a group from RHSSO", async () => {
    test.setTimeout(300 * 1000);
    if (test.info().retry > 0) {
      await waitForNextSync("rhsso", syncTime);
    }
    // remove a group -> ensure group and its members still exists, member should still login
    // remove group_3
    LOGGER.info(
      `Executing testcase: Remove a group from RHSSO: ensure group and its members still exists, member should still login before next sync.`,
    );

    await rhssoHelper.deleteGroup(groupsCreated["group_4"].id);
    // user_4 should login
    await common.keycloakLogin(
      constants.RHSSO76_USERS["user_4"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    // group_4 should exist in rhdh
    const displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.RHSSO76_GROUPS["group_4"].name,
    );
    expect(displayed.groupMembers).toContain(
      rhssoHelper.getRHSSOUserDisplayName(constants.RHSSO76_USERS["user_4"]),
    );

    await uiHelper.openSidebar("Settings");
    await common.signOut();

    // waiting for next sync
    await waitForNextSync("rhsso", syncTime);

    // after the sync ensure the group entity is removed
    LOGGER.info(
      `Execute testcase: Remove a group from RHSSO: group should be removed and permissions should default to read-only after the sync.`,
    );
    await common.keycloakLogin(
      constants.RHSSO76_USERS["admin"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    await expect(
      common.CheckGroupIsShowingInCatalog([
        constants.RHSSO76_GROUPS["group_4"].name,
      ]),
    ).rejects.toThrow();

    await uiHelper.openSidebar("Settings");
    await common.signOut();

    await common.keycloakLogin(
      constants.RHSSO76_USERS["user_4"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    // users permission based on that group will be defaulted to read-only
    // expect user not to see catalog entities
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
    LOGGER.info(
      `Executing testcase: Remove a user from RHDH: authentication should work, but access is denied before next sync.`,
    );
    if (test.info().retry > 0) {
      await waitForNextSync("rhsso", syncTime);
    }
    await common.keycloakLogin(
      constants.RHSSO76_USERS["admin"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await common.UnregisterUserEnittyFromCatalog(
      rhssoHelper.getRHSSOUserDisplayName(constants.RHSSO76_USERS["user_4"]),
    );
    await uiHelper.verifyAlertErrorMessage(/Removed entity/gm);

    await expect(async () => {
      await common.CheckUserIsShowingInCatalog([
        rhssoHelper.getRHSSOUserDisplayName(constants.RHSSO76_USERS["user_4"]),
      ]);
    }).not.toPass({
      intervals: [1_000, 2_000, 5_000],
      timeout: 20 * 1000,
    });

    await uiHelper.openSidebar("Settings");
    await common.signOut();

    const loginSucceded = await common.keycloakLogin(
      constants.RHSSO76_USERS["user_4"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    expect(loginSucceded).toContain("Login successful");

    await uiHelper.verifyAlertErrorMessage(/unable to resolve user identity/gm);

    // clear user sessions
    await rhssoHelper.clearUserSessions(
      constants.RHSSO76_USERS["user_4"].username,
      constants.AUTH_PROVIDERS_REALM_NAME,
    );

    await waitForNextSync("rhsso", syncTime);

    LOGGER.info(
      `Execute testcase: Remove a user from RHDH: user is re-created and can login after the sync`,
    );
    await common.keycloakLogin(
      constants.RHSSO76_USERS["user_4"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await common.CheckUserIsShowingInCatalog([
      rhssoHelper.getRHSSOUserDisplayName(constants.RHSSO76_USERS["user_4"]),
    ]);
    await uiHelper.openSidebar("Settings");
    await common.signOut();
  });

  test("Remove a group from RHDH", async () => {
    test.setTimeout(300 * 1000);

    // remove group from RHDH -> user can login, but policy is broken
    LOGGER.info(
      `Executing testcase: Remove a group from RHDH: user can login, but policy is broken before next sync.`,
    );
    if (test.info().retry >= 0) {
      await waitForNextSync("rhsso", syncTime);
    }
    await common.keycloakLogin(
      constants.RHSSO76_USERS["admin"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    await common.UnregisterGroupEnittyFromCatalog(
      constants.RHSSO76_GROUPS["group_3"].name,
    );

    await uiHelper.verifyAlertErrorMessage(/Removed entity/gm);

    await expect(
      common.CheckGroupIsShowingInCatalog([
        constants.RHSSO76_GROUPS["group_3"].name,
      ]),
    ).rejects.toThrow(/Expected at least one cell/);

    await uiHelper.openSidebar("Settings");
    await common.signOut();

    await waitForNextSync("rhsso", syncTime);

    // after sync, ensure group is created again and memembers can login
    LOGGER.info(
      `Execute testcase: Remove a group from RHDH: group is created again after the sync`,
    );
    await common.keycloakLogin(
      constants.RHSSO76_USERS["admin"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await common.CheckGroupIsShowingInCatalog([
      constants.RHSSO76_GROUPS["group_3"].name,
    ]);
    await uiHelper.openSidebar("Settings");
    await common.signOut();
  });

  test("Rename a user and a group", async () => {
    test.setTimeout(300 * 1000);
    if (test.info().retry > 0) {
      await waitForNextSync("rhsso", syncTime);
    }

    // rename group -> user can login, but policy is broken
    LOGGER.info(`Executing testcase: Rename a user and a group.`);

    await rhssoHelper.updateUser(usersCreated["user_2"].id, {
      lastName: constants.RHSSO76_USERS["user_2"].lastName + " Renamed",
      emailVerified: true,
      email: constants.RHSSO76_USERS["user_2"].username + "@rhdh.com",
    });

    await rhssoHelper.updateGruop(groupsCreated["group_2"].id, {
      name: constants.RHSSO76_GROUPS["group_2"].name + "_renamed",
    });

    // waiting for next sync
    await waitForNextSync("rhsso", syncTime);

    // after sync, ensure group is mirrored
    // after sync, ensure user change is mirrorred
    LOGGER.info(
      `Execute testcase: Rename a user and a group: changes are mirrored in RHDH but permissions should be broken after the sync`,
    );
    await common.keycloakLogin(
      constants.RHSSO76_USERS["admin"].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await common.CheckUserIsShowingInCatalog([
      (await rhssoHelper.getRHSSOUserDisplayName(
        constants.RHSSO76_USERS["user_2"],
      )) + " Renamed",
    ]);
    await common.CheckGroupIsShowingInCatalog([
      constants.RHSSO76_GROUPS["group_2"].name + "_renamed",
    ]);

    await uiHelper.openSidebar("Settings");
    await common.signOut();

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
      LOGGER.info(
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
});
