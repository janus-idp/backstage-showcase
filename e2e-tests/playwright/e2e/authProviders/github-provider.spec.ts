import { test, Page, expect } from "@playwright/test";
import { Common, setupBrowser } from "../../utils/Common";
import { UIhelper } from "../../utils/UIhelper";
import * as constants from "../../utils/authenticationProviders/constants";
import { logger } from "../../utils/Logger";
import {
  upgradeHelmChartWithWait,
  WaitForNextSync,
  replaceInRBACPolicyFileConfigMap,
} from "../../utils/helper";
import { BrowserContext } from "@playwright/test";
import * as ghHelper from "../../utils/authenticationProviders/githubHelper";

let page: Page;

test.describe("Standard authentication providers: Github Provider", () => {
  test.use({ baseURL: constants.AUTH_PROVIDERS_BASE_URL });

  let common: Common;
  let context: BrowserContext;
  let uiHelper: UIhelper;
  const syncTime = 60;

  test.beforeAll(async ({ browser }, testInfo) => {
    const browserSetup = await setupBrowser(browser, testInfo);
    page = browserSetup.page;
    context = browserSetup.context;
    common = new Common(page);
    uiHelper = new UIhelper(page);
    expect(process.env.BASE_URL).not.toBeNull();
    logger.info(`Base Url is ${process.env.BASE_URL}`);
    logger.info(
      `Starting scenario: Standard authentication providers: Basic authentication: attemp #${testInfo.retry}`,
    );

    await ghHelper.setupGithubEnvironment();
  });

  test("Setup Github authentication provider and wait for first sync", async () => {
    test.setTimeout(300 * 1000);
    logger.info(
      "Execute testcase: Setup Github authentication provider and wait for first sync",
    );

    await upgradeHelmChartWithWait(
      constants.AUTH_PROVIDERS_RELEASE,
      constants.AUTH_PROVIDERS_CHART,
      constants.AUTH_PROVIDERS_NAMESPACE,
      constants.AUTH_PROVIDERS_VALUES_FILE,
      constants.CHART_VERSION,
      constants.QUAY_REPO,
      constants.TAG_NAME,
      [
        "--set upstream.backstage.appConfig.signInPage=github",
        "--set upstream.backstage.appConfig.auth.environment=production",
        "--set upstream.backstage.appConfig.catalog.providers.microsoftGraphOrg=null",
        "--set upstream.backstage.appConfig.catalog.providers.keycloakOrg=null",
        "--set upstream.backstage.appConfig.auth.providers.microsoft=null",
        "--set upstream.backstage.appConfig.auth.providers.oidc=null",
        "--set global.dynamic.plugins[1].disabled=false",
        "--set global.dynamic.plugins[3].disabled=false",
        "--set upstream.backstage.appConfig.permission.enabled=true",
        "--set upstream.postgresql.primary.persistence.enabled=false",
      ],
    );

    await WaitForNextSync(syncTime, "github");
  });

  test("Github with default resolver: user should login and entity is in the catalog", async () => {
    // resolvers from upstream are not available in rhdh
    // testing only default settings

    logger.info(
      "Executing testcase: Github with default resolver: user should login and entity is in the catalog",
    );
    test.setTimeout(300 * 1000);
    if (test.info().retry > 0) {
      await WaitForNextSync(syncTime, "github");
    }

    await page.goto("/");
    await uiHelper.verifyHeading("Select a sign-in method");
    const singInMethods = await page
      .locator("div[class^='MuiCardHeader-root']")
      .allInnerTexts();
    expect(singInMethods).not.toContain("Guest");

    await common.githubLogin(
      constants.GH_USERS["admin"].name,
      constants.GH_USER_PASSWORD,
    );

    await page.goto("/");
    await uiHelper.openSidebar("Catalog");
    await page.reload();
    await uiHelper.selectMuiBox("Kind", "User");
    await uiHelper.verifyHeading("All users");
    await uiHelper.verifyCellsInTable([constants.GH_USERS["user_1"].name]);
    await uiHelper.openSidebar("Settings");
    await common.signOut();
  });

  test("Ingestion of Users and Nested Groups: verify the UserEntities and Groups are created with the correct relationships in RHDH ", async () => {
    test.setTimeout(300 * 1000);
    if (test.info().retry > 0) {
      await WaitForNextSync(syncTime, "github");
    }
    await common.githubLogin(
      constants.GH_USERS["admin"].name,
      constants.GH_USER_PASSWORD,
    );

    // check entities are in the catalog
    const usersDisplayNames = Object.values(constants.GH_USERS).map(
      (u) => u.name,
    );
    await common.CheckUserIsShowingInCatalog(usersDisplayNames);

    // check groups are nested correctly and display all members
    const groupsDisplayNames = Object.values(constants.GH_TEAMS).map(
      (g) => g.name,
    );
    await common.CheckGroupIsShowingInCatalog(groupsDisplayNames);

    let displayed;

    // check team1
    displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.GH_TEAMS["team_1"].name,
    );
    expect(displayed.groupMembers).toContain(constants.GH_USERS["admin"].name);

    // check team2
    displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.GH_TEAMS["team_2"].name,
    );
    expect(displayed.groupMembers).toEqual([]);
    expect(displayed.childGroups).toContain(constants.GH_TEAMS["team_3"].name);

    // check team3
    displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.GH_TEAMS["team_3"].name,
    );
    expect(displayed.groupMembers).toContain(constants.GH_USERS["user_1"].name);
    expect(displayed.parentGroup).toContain(constants.GH_TEAMS["team_2"].name);

    // check team4
    displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.GH_TEAMS["team_4"].name,
    );
    expect(displayed.groupMembers).toContain(constants.GH_USERS["user_1"].name);

    // check location_admin
    displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.GH_TEAMS["location_admin"].name,
    );
    expect(displayed.groupMembers).toContain(constants.GH_USERS["admin"].name);

    await page.goto("/");
    await uiHelper.openSidebar("Settings");
    await common.signOut();
  });

  test("Remove a user from RHDH", async () => {
    test.setTimeout(300 * 1000);
    if (test.info().retry > 0) {
      await WaitForNextSync(syncTime, "github");
    }
    // remove user from RHDH -> authentication works, access is broken
    logger.info(
      `Executing testcase: Remove a user from RHDH: authentication should work, but access is denied before next sync.`,
    );

    await common.githubLogin(
      constants.GH_USERS["admin"].name,
      constants.GH_USER_PASSWORD,
    );
    logger.info("Unregistering user1 from catalog");

    await common.UnregisterUserEnittyFromCatalog(
      constants.GH_USERS["user_1"].name,
    );
    logger.info("Checking alert message after login");
    await uiHelper.verifyAlertErrorMessage(/Removed entity/gm);

    await expect(async () => {
      await common.CheckUserIsShowingInCatalog([
        constants.GH_USERS["user_1"].name,
      ]);
    }).not.toPass({
      intervals: [1_000, 2_000, 5_000],
      timeout: 20 * 1000,
    });

    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies();

    const loginSucceded = await common.githubLogin(
      constants.GH_USERS["user_1"].name,
      constants.GH_USER_PASSWORD,
    );
    expect(loginSucceded).toContain("Login successful");

    await uiHelper.verifyAlertErrorMessage(/User not found/gm);

    await context.clearCookies();

    // waiting for next sync
    await WaitForNextSync(syncTime, "github");

    // after sync, user_4 is created again and can login
    logger.info(
      `Execute testcase: Remove a user from RHDH: user is re-created and can login after the sync`,
    );

    await common.githubLogin(
      constants.GH_USERS["user_1"].name,
      constants.GH_USER_PASSWORD,
    );
    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies();
  });

  test("Remove a group from RHDH", async () => {
    test.setTimeout(300 * 1000);
    if (test.info().retry > 0) {
      await WaitForNextSync(syncTime, "github");
    }

    // remove group from RHDH -> user can login, but policy is broken
    logger.info(
      `Executing testcase: Remove a group from RHDH: user can login, but policy is broken before next sync.`,
    );

    await common.githubLogin(
      constants.GH_USERS["admin"].name,
      constants.GH_USER_PASSWORD,
    );
    await common.UnregisterGroupEnittyFromCatalog(
      constants.GH_TEAMS["team_1"].name,
    );
    await uiHelper.verifyAlertErrorMessage(/Removed entity/gm);

    await expect(async () => {
      await common.CheckGroupIsShowingInCatalog([
        constants.GH_TEAMS["team_1"].name,
      ]);
    }).not.toPass({
      intervals: [1_000, 2_000, 5_000],
      timeout: 20 * 1000,
    });

    // waiting for next sync
    await WaitForNextSync(syncTime, "github");

    // after sync, ensure group is created again and memembers can login
    logger.info(
      `Execute testcase: Remove a group from RHDH: group is created again after the sync`,
    );

    await page.reload();

    await common.CheckGroupIsShowingInCatalog([
      constants.GH_TEAMS["team_1"].name,
    ]);
    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user
  });

  test("Move a user to another group in Github", async () => {
    test.setTimeout(300 * 1000);
    if (test.info().retry > 0) {
      await WaitForNextSync(syncTime, "github");
    }
    // move a user to another group -> ensure user can still login
    logger.info(
      `Executing testcase: Move a user to another group in Github: user should still login before next sync.`,
    );

    await ghHelper.removeMemberToTeam(
      constants.GH_TEAMS["team_3"].name,
      constants.AUTH_PROVIDERS_GH_ORG_NAME,
      constants.GH_USERS["user_1"].name,
    );
    await ghHelper.addMemberToTeam(
      constants.GH_TEAMS["location_admin"].name,
      constants.AUTH_PROVIDERS_GH_ORG_NAME,
      constants.GH_USERS["user_1"].name,
    );

    await common.githubLogin(
      constants.GH_USERS["user_1"].name,
      constants.GH_USER_PASSWORD,
    );

    await page.goto("/");
    await uiHelper.openSidebar("Catalog");
    // submenu with groups opens randomly in headless mode, blocking visibility of the other elements
    await page.reload();
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

    await WaitForNextSync(syncTime, "github");

    // ensure the change is mirrored in the catalog
    logger.info(
      `Execute testcase: Move a user to another group in Github: change should be mirrored and permission should be updated after the sync`,
    );
    await common.githubLogin(
      constants.GH_USERS["user_1"].name,
      constants.GH_USER_PASSWORD,
    );

    const displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.GH_TEAMS["location_admin"].name,
    );
    expect(displayed.groupMembers).toContain(constants.GH_USERS["user_1"].name);

    // configure policy permissions different for the two groups
    // after the sync, ensure the permission also reflect the user move
    // check RBAC permissions are updated after group update
    // new group should allow user to schedule location refresh and unregister the entity
    await uiHelper.verifyLocationRefreshButtonIsEnabled("example");

    await page.goto("/");
    await uiHelper.openSidebar("Settings");
    await common.signOut();
  });

  test("Remove a group from Github", async () => {
    test.setTimeout(300 * 1000);
    if (test.info().retry > 0) {
      await WaitForNextSync(syncTime, "github");
    }
    // remove a group -> members still exists, member should still login
    logger.info(
      `Executing testcase: Remove a group from Microsoft EntraID: ensure group and its members still exists, member should still login before next sync.`,
    );

    await ghHelper.deleteTeam(
      constants.GH_TEAMS["team_4"].name,
      constants.AUTH_PROVIDERS_GH_ORG_NAME,
    );
    // user should login
    await common.githubLogin(
      constants.GH_USERS["admin"].name,
      constants.GH_USER_PASSWORD,
    );

    // team should exist in rhdh
    const displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.GH_TEAMS["team_4"].name,
    );
    expect(displayed.groupMembers).toContain(constants.GH_USERS["user_1"].name);

    // waiting for next sync
    await WaitForNextSync(syncTime, "github");

    // after the sync ensure the group entity is removed
    logger.info(
      `Execute testcase: Remove a group from Github: group should be removed and permissions should default to read-only after the sync.`,
    );

    await expect(
      common.CheckGroupIsShowingInCatalog([constants.GH_USERS["user_1"].name]),
    ).rejects.toThrow();

    await page.goto("/");
    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies();

    // users permission based on that group will be defaulted to read-only
    // expect user not to see catalog entities
    await common.githubLogin(
      constants.GH_USERS["user_1"].name,
      constants.GH_USER_PASSWORD,
    );

    await page.goto("/");
    const navMyGroup = page.locator(`nav a:has-text("My Group")`);
    await expect(navMyGroup).toHaveCount(0);

    await page.goto("/");
    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user
  });

  test("Rename a user and a group", async () => {
    test.setTimeout(600 * 1000);
    if (test.info().retry > 0) {
      await WaitForNextSync(syncTime, "github");
    }
    // rename group from RHDH -> user can login, but policy is broken
    logger.info(`Executing testcase: Rename a user and a group.`);

    await ghHelper.removeUserFromAllTeams(
      constants.GH_USERS["user_1"].name,
      constants.AUTH_PROVIDERS_GH_ORG_NAME,
    );
    await ghHelper.addMemberToTeam(
      constants.GH_TEAMS["team_2"].name,
      constants.AUTH_PROVIDERS_GH_ORG_NAME,
      constants.GH_USERS["user_1"].name,
    );
    await ghHelper.renameTeam(
      constants.GH_TEAMS["team_2"].name,
      constants.AUTH_PROVIDERS_GH_ORG_NAME,
      constants.GH_TEAMS["team_2"].name + "_renamed",
    );

    // waiting for next sync
    await WaitForNextSync(syncTime, "github");

    // after sync, ensure group is mirrored
    logger.info(
      `Execute testcase: Rename a user and a group: changes are mirrored in RHDH but permissions should be broken after the sync`,
    );
    await common.githubLogin(
      constants.GH_USERS["admin"].name,
      constants.GH_USER_PASSWORD,
    );

    await common.CheckGroupIsShowingInCatalog([
      constants.GH_TEAMS["team_2"].name + "_renamed",
    ]);
    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user

    await common.githubLogin(
      constants.GH_USERS["user_1"].name,
      constants.GH_USER_PASSWORD,
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
      constants.GH_TEAMS["team_2"].name,
      constants.GH_TEAMS["team_2"].name + "_renamed",
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
      constants.GH_TEAMS["team_2"].name + "_renamed",
    );

    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user
  });
});
