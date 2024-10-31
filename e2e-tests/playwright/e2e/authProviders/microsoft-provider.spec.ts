import { test, Page, expect } from "@playwright/test";
import { Common, setupBrowser } from "../../utils/Common";
import { UIhelper } from "../../utils/UIhelper";
import UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation";
import * as constants from "../../utils/authenticationProviders/constants";
import { logger } from "../../utils/Logger";
import * as graphHelper from "../../utils/authenticationProviders/msgraphHelper";
import { BrowserContext } from "@playwright/test";
import GroupRepresentation from "@keycloak/keycloak-admin-client/lib/defs/groupRepresentation";
import {
  upgradeHelmChartWithWait,
  WaitForNextSync,
  replaceInRBACPolicyFileConfigMap,
} from "../../utils/helper";

let page: Page;

test.describe("Standard authentication providers: Micorsoft Azure EntraID", () => {
  test.use({ baseURL: constants.AUTH_PROVIDERS_BASE_URL });

  let common: Common;
  let context: BrowserContext;
  let uiHelper: UIhelper;
  let usersCreated: Map<string, UserRepresentation>;
  let groupsCreated: Map<string, GroupRepresentation>;
  const SYNC_TIME = 60;

  test.beforeAll(async ({ browser }, testInfo) => {
    logger.info(
      `Staring scenario: Standard authentication providers: Micorsoft Azure EntraID: attemp #${testInfo.retry}`,
    );

    const browserSetup = await setupBrowser(browser, testInfo);
    page = browserSetup.page;
    context = browserSetup.context;
    common = new Common(page);
    uiHelper = new UIhelper(page);
    expect(process.env.BASE_URL).not.toBeNull();
    logger.info(`Base Url is ${process.env.BASE_URL}`);

    const created = await graphHelper.setupMicrosoftEntraIDEnvironment();
    usersCreated = created.usersCreated;
    groupsCreated = created.groupsCreated;
  });

  test("Setup RHDH with Microsoft EntraID ingestion and eventually wait for the first sync", async () => {
    test.setTimeout(600 * 1000);
    const oidcFlow = false;
    const oauthFlags = [
      "--set upstream.backstage.appConfig.auth.providers.github=null",
      "--set upstream.backstage.appConfig.signInPage=microsoft",
      "--set upstream.backstage.appConfig.auth.environment=production",
      "--set upstream.backstage.appConfig.catalog.providers.githubOrg=null",
      "--set upstream.backstage.appConfig.catalog.providers.keycloakOrg=null",
      "--set global.dynamic.plugins[2].disabled=false",
      "--set global.dynamic.plugins[3].disabled=false",
      "--set upstream.backstage.appConfig.permission.enabled=true",
    ];

    const oidcFlags = [
      "--set upstream.backstage.appConfig.auth.providers.github=null",
      "--set upstream.backstage.appConfig.signInPage=oidc",
      "--set upstream.backstage.appConfig.auth.environment=production",
      "--set upstream.backstage.appConfig.catalog.providers.githubOrg=null",
      "--set upstream.backstage.appConfig.catalog.providers.keycloakOrg=null",
      "--set global.dynamic.plugins[2].disabled=false",
      "--set global.dynamic.plugins[3].disabled=false",
      "--set upstream.backstage.appConfig.permission.enabled=true",
      "--set upstream.backstage.appConfig.auth.providers.oidc.production.metadataUrl=https://login.microsoftonline.com/${AUTH_PROVIDERS_AZURE_TENANT_ID}/.well-known/openid-configuration",
      "--set upstream.backstage.appConfig.auth.providers.oidc.production.tenantId=${AUTH_PROVIDERS_AZURE_TENANT_ID}",
      "--set upstream.backstage.appConfig.auth.providers.oidc.production.clientId=${AUTH_PROVIDERS_AZURE_CLIENT_ID}",
      "--set upstream.backstage.appConfig.auth.providers.oidc.production.clientSecret=${AUTH_PROVIDERS_AZURE_CLIENT_SECRET}",
      "--set upstream.backstage.appConfig.auth.providers.oidc.production.prompt=auto",
      "--set upstream.backstage.appConfig.auth.providers.oidc.production.callbackUrl=${BASE_URL}/api/auth/oidc/handler/frame",
      "--set upstream.backstage.appConfig.dangerouslyAllowSignInWithoutUserInCatalog=true",
      "--set upstream.backstage.appConfig.auth.providers.oidc.production.signIn.resolvers[0].resolver=emailMatchingUserEntityProfileEmail",
    ];
    // setup RHSSO provider with user ingestion
    await upgradeHelmChartWithWait(
      constants.AUTH_PROVIDERS_RELEASE,
      constants.AUTH_PROVIDERS_CHART,
      constants.AUTH_PROVIDERS_NAMESPACE,
      constants.AUTH_PROVIDERS_VALUES_FILE,
      constants.CHART_VERSION,
      constants.QUAY_REPO,
      constants.TAG_NAME,
      oidcFlow ? oidcFlags : oauthFlags,
    );

    await WaitForNextSync(SYNC_TIME, "microsoft");
  });

  test("Microsoft EntraID with default resolver: user_1 should login and entity is in the catalog", async () => {
    // resolvers from upstream are not available in rhdh
    // testing only default settings

    logger.info(
      "Executing testcase: Setup Microsoft EntraID with default resolver: user_1 should login and entity is in the catalog",
    );
    test.setTimeout(300 * 1000);
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC_TIME, "microsoft");
    }

    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS["user_1"].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    // check no entities are in the catalog
    await page.goto("/");
    await uiHelper.openSidebar("Catalog");
    await uiHelper.selectMuiBox("Kind", "User");
    await uiHelper.verifyHeading("All users");
    await uiHelper.verifyCellsInTable([
      constants.MSGRAPH_USERS["user_1"].displayName,
    ]);
    await uiHelper.openSidebar("Settings");
    await common.signOut();
  });

  test("Ingestion of Users and Nested Groups: verify the UserEntities and Groups are created with the correct relationships in RHDH ", async () => {
    test.setTimeout(300 * 1000);
    await WaitForNextSync(SYNC_TIME, "microsoft");

    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS["admin"].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    // check entities are in the catalog
    const usersDisplayNames = Object.values(constants.MSGRAPH_USERS).map(
      (u) => u.displayName,
    );
    await common.CheckUserIsShowingInCatalog(usersDisplayNames);

    // check groups are nested correctly and display all members
    const groupsDisplayNames = Object.values(constants.MSGRAPH_GROUPS).map(
      (g) => g.displayName,
    );
    await common.CheckGroupIsShowingInCatalog(groupsDisplayNames);

    let displayed;

    // group_1 should show jenny_doe and user_1
    displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.MSGRAPH_GROUPS["group_1"].displayName,
    );
    expect(displayed.groupMembers).toContain(
      constants.MSGRAPH_USERS["user_1"].displayName,
    );
    expect(displayed.groupMembers).toContain(
      constants.MSGRAPH_USERS["jenny_doe"].displayName,
    );
    expect(displayed.childGroups).toHaveLength(0);

    // group_2 should show jenny_doe and user_2 and parent group: group_4
    displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.MSGRAPH_GROUPS["group_2"].displayName,
    );
    expect(displayed.groupMembers).toContain(
      constants.MSGRAPH_USERS["user_2"].displayName,
    );
    expect(displayed.groupMembers).toContain(
      constants.MSGRAPH_USERS["jenny_doe"].displayName,
    );

    // group_3 should show user_3 and parent group: group_4
    displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.MSGRAPH_GROUPS["group_3"].displayName,
    );
    expect(displayed.groupMembers).toContain(
      constants.MSGRAPH_USERS["user_3"].displayName,
    );
    expect(displayed.parentGroup).toContain(
      constants.MSGRAPH_GROUPS["group_4"].displayName,
    );

    // group_4 should show user_4 and two child groups: group_2 and group_3
    displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.MSGRAPH_GROUPS["group_4"].displayName,
    );
    expect(displayed.groupMembers).toContain(
      constants.MSGRAPH_USERS["user_4"].displayName,
    );
    expect(displayed.childGroups).toContain(
      constants.MSGRAPH_GROUPS["group_3"].displayName,
    );

    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user
  });

  test("Remove user from Microsoft EntraID", async () => {
    test.setTimeout(300 * 1000);
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC_TIME, "microsoft");
    }

    // remove user from azure -> authentication fails
    logger.info(
      `Executing testcase: Remove user from Microsoft EntraID: authenticatin should fail before next sync.`,
    );
    await graphHelper.deleteUserByUpnAsync(
      constants.MSGRAPH_USERS["user_1"].userPrincipalName,
    );
    const user = await graphHelper.getUserByUpnAsync(
      constants.MSGRAPH_USERS["user_1"].userPrincipalName,
    );
    expect(user).toBeNull();

    await page.waitForTimeout(10000); // Azure needs a couple of seconds to process the user deletion or random errors will be returned

    const login = await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS["user_1"].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    if (login == "Login successful") {
      await uiHelper.verifyAlertErrorMessage(/Authentication failed/gm);
    } else {
      expect(login).toContain("User does not exist");
    }

    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user

    // waiting for next sync
    await WaitForNextSync(SYNC_TIME, "microsoft");

    // after the sync
    // check user_1 is deleted from user entities and group entities

    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS["admin"].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    await expect(
      common.CheckUserIsShowingInCatalog([
        constants.MSGRAPH_USERS["user_1"].displayName,
      ]),
    ).rejects.toThrow();

    const displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.MSGRAPH_GROUPS["group_1"].displayName,
    );
    expect(displayed.groupMembers).not.toContain(
      constants.MSGRAPH_USERS["user_1"].displayName,
    );
    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user
  });

  test("Move a user to another group in Microsoft EntraID", async () => {
    test.setTimeout(300 * 1000);
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC_TIME, "microsoft");
    }
    // move a user to another group -> user can still login
    // move user_2 to group_1
    logger.info(
      `Executing testcase: Move a user to another group in Microsoft EntraID: user should still login before next sync.`,
    );

    await graphHelper.addUserToGroupAsync(
      usersCreated["user_2"],
      groupsCreated["location_admin"],
    );
    await graphHelper.removeUserFromGroupAsync(
      usersCreated["user_2"],
      groupsCreated["group_2"],
    );
    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS["user_2"].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    await page.goto("/");
    await uiHelper.openSidebar("Catalog");
    await uiHelper.selectMuiBox("Kind", "Location");
    await uiHelper.verifyHeading("All locations");
    await uiHelper.verifyCellsInTable(["example"]);
    await uiHelper.clickLink("example");
    await uiHelper.verifyHeading("example");
    await expect(
      page.locator(`button[title="Schedule entity refresh"]`),
    ).toHaveCount(0);

    await page.goto("/");
    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user

    // waiting for next sync
    await WaitForNextSync(SYNC_TIME, "microsoft");

    // after the sync
    // ensure the change is mirrored in the catalog
    logger.info(
      `Execute testcase: Move a user to another group in Microsoft EntraID: change should be mirrored and permission should be updated after the sync`,
    );
    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS["user_2"].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    const displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.MSGRAPH_GROUPS["location_admin"].displayName,
    );
    expect(displayed.groupMembers).toContain(
      constants.MSGRAPH_USERS["user_2"].displayName,
    );

    // check RBAC permissions are updated after group update
    // new group should allow user to schedule location refresh and unregister the entity
    await uiHelper.verifyLocationRefreshButtonIsEnabled("example");

    await page.goto("/");
    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user
  });

  test("Remove a group from Microsoft EntraID", async () => {
    test.setTimeout(300 * 1000);
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC_TIME, "microsoft");
    }
    // remove a group -> members still exists, member should still login
    // remove group_3
    logger.info(
      `Executing testcase: Remove a group from Microsoft EntraID: ensure group and its members still exists, member should still login before next sync.`,
    );

    await graphHelper.deleteGroupByIdAsync(groupsCreated["group_3"].id);
    // user_3 should login
    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS["admin"].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    // group_3 should exist in rhdh
    const displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.MSGRAPH_GROUPS["group_3"].displayName,
    );
    expect(displayed.groupMembers).toContain(
      constants.MSGRAPH_USERS["user_3"].displayName,
    );
    expect(displayed.parentGroup).toContain(
      constants.MSGRAPH_GROUPS["group_4"].displayName,
    );

    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user

    // waiting for next sync
    await WaitForNextSync(SYNC_TIME, "microsoft");

    // after the sync ensure the group entity is removed
    logger.info(
      `Execute testcase: Remove a group from Microsoft EntraID: group should be removed and permissions should default to read-only after the sync.`,
    );
    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS["admin"].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await expect(
      common.CheckGroupIsShowingInCatalog([
        constants.MSGRAPH_GROUPS["group_3"].displayName,
      ]),
    ).rejects.toThrow();

    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user

    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS["user_3"].userPrincipalName,
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
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user
  });

  test("Remove a user from RHDH", async () => {
    test.setTimeout(300 * 1000);
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC_TIME, "microsoft");
    }

    // remove user from RHDH -> authentication works, access is broken
    logger.info(
      `Executing testcase: Remove a user from RHDH: authentication should work, but access is denied before next sync.`,
    );

    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS["admin"].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    logger.info("Unregistering user 3 from catalog");
    await common.UnregisterUserEnittyFromCatalog(
      constants.MSGRAPH_USERS["user_3"].displayName,
    );
    logger.info("Checking alert message after login");
    await uiHelper.verifyAlertErrorMessage(/Removed entity/gm);

    await expect(async () => {
      await common.CheckUserIsShowingInCatalog([
        constants.RHSSO76_USERS["user_4"].firstName +
          " " +
          constants.RHSSO76_USERS["user_4"].lastName,
      ]);
    }).not.toPass({
      intervals: [1_000, 2_000, 5_000],
      timeout: 20 * 1000,
    });

    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user

    const loginSucceded = await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS["user_3"].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    expect(loginSucceded).toContain("Login successful");

    await uiHelper.verifyAlertErrorMessage(
      /User not found in the RHDH software catalog/gm,
    );

    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user

    // waiting for next sync
    await WaitForNextSync(SYNC_TIME, "microsoft");

    // after sync, user_4 is created again and can login
    logger.info(
      `Execute testcase: Remove a user from RHDH: user is re-created and can login after the sync`,
    );

    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS["user_3"].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user
  });

  test("Remove a group from RHDH", async () => {
    test.setTimeout(300 * 1000);
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC_TIME, "microsoft");
    }

    // remove group from RHDH -> user can login, but policy is broken
    logger.info(
      `Executing testcase: Remove a group from RHDH: user can login, but policy is broken before next sync.`,
    );

    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS["admin"].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await common.UnregisterGroupEnittyFromCatalog(
      constants.MSGRAPH_GROUPS["group_5"].displayName,
    );
    await uiHelper.verifyAlertErrorMessage(/Removed entity/gm);
    await uiHelper.openSidebar("Settings");
    await common.signOut();

    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS["user_5"].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user

    // waiting for next sync
    await WaitForNextSync(SYNC_TIME, "microsoft");

    // after sync, ensure group_5 is created again and memembers can login
    logger.info(
      `Execute testcase: Remove a group from RHDH: group is created again after the sync`,
    );
    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS["user_5"].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await common.CheckGroupIsShowingInCatalog([
      constants.MSGRAPH_GROUPS["group_5"].displayName,
    ]);
    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user
  });

  test("Rename a user and a group", async () => {
    test.setTimeout(600 * 1000);
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC_TIME, "microsoft");
    }
    await WaitForNextSync(SYNC_TIME, "microsoft");
    // rename group from RHDH -> user can login, but policy is broken
    logger.info(`Executing testcase: Rename a user and a group.`);

    await graphHelper.updateGrouprAsync(groupsCreated["group_6"], {
      displayName: groupsCreated["group_6"].displayName + "_renamed",
    });
    await graphHelper.updateUserAsync(usersCreated["user_6"], {
      displayName: usersCreated["user_6"].displayName + " Renamed",
      userPrincipalName: "renamed_" + usersCreated["user_6"].userPrincipalName,
    });

    // waiting for next sync
    await WaitForNextSync(SYNC_TIME, "microsoft");

    // after sync, ensure group is mirrored
    // after sync, ensure user change is mirrorred
    logger.info(
      `Execute testcase: Rename a user and a group: changes are mirrored in RHDH but permissions should be broken after the sync`,
    );
    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS["admin"].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await common.CheckUserIsShowingInCatalog([
      constants.MSGRAPH_USERS["user_6"].displayName + " Renamed",
    ]);
    await common.CheckGroupIsShowingInCatalog([
      constants.MSGRAPH_GROUPS["group_6"].displayName + "_renamed",
    ]);
    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user

    await common.MicrosoftAzureLogin(
      "renamed_" + constants.MSGRAPH_USERS["user_6"].userPrincipalName,
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
      constants.MSGRAPH_GROUPS["group_6"].displayName,
      constants.MSGRAPH_GROUPS["group_6"].displayName + "_renamed",
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
      constants.MSGRAPH_GROUPS["group_6"].displayName + "_renamed",
    );

    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user
  });
});
