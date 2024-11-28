import { test, Page, expect } from "@playwright/test";
import { Common, setupBrowser } from "../../utils/Common";
import { UIhelper } from "../../utils/UIhelper";
import * as constants from "../../utils/authenticationProviders/constants";
import { logger } from "../../utils/Logger";
import {
  upgradeHelmChartWithWait,
  WaitForNextSync,
  replaceInRBACPolicyFileConfigMap,
  parseGroupMemberFromEntity,
  parseGroupChildrenFromEntity,
  parseGroupParentFromEntity,
  dumpAllPodsLogs,
  dumpRHDHUsersAndGroups,
} from "../../utils/helper";
import { BrowserContext } from "@playwright/test";
import * as ghHelper from "../../utils/authenticationProviders/githubHelper";
import { APIHelper } from "../../utils/APIHelper";
import { GroupEntity } from "@backstage/catalog-model";
import { RhdhAuthHack } from "../../support/api/rhdh-auth-hack";

let page: Page;

test.describe("Standard authentication providers: Github Provider", () => {
  test.use({ baseURL: constants.AUTH_PROVIDERS_BASE_URL });

  let common: Common;
  let context: BrowserContext;
  let uiHelper: UIhelper;
  const SYNC_TIME = 60;
  let MUST_SYNC = false;

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

    await WaitForNextSync(SYNC_TIME, "github");
  });

  test("Github with default resolver: user should login and entity is in the catalog", async () => {
    // resolvers from upstream are not available in rhdh
    // testing only default settings

    logger.info(
      "Executing testcase: Github with default resolver: user should login and entity is in the catalog",
    );
    test.setTimeout(300 * 1000);
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC_TIME, "github");
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

    // check entities are in the catalog
    const usersDisplayNames = Object.values(constants.GH_USERS).map(
      (u) => u.name,
    );
    expect(
      await common.CheckUserIsIngestedInCatalog(
        usersDisplayNames,
        constants.STATIC_API_TOKEN,
      ),
    ).toBe(true);

    // check groups are nested correctly and display all members
    const groupsDisplayNames = Object.values(constants.GH_TEAMS).map(
      (g) => g.name,
    );
    expect(
      await common.CheckGroupIsIngestedInCatalog(
        groupsDisplayNames,
        constants.STATIC_API_TOKEN,
      ),
    ).toBe(true);

    const api = new APIHelper();
    api.UseStaticToken(constants.STATIC_API_TOKEN);

    // check team1
    const group_1: GroupEntity = await api.getGroupEntityFromAPI(
      constants.GH_TEAMS["team_1"].name,
    );
    const members_1 = parseGroupMemberFromEntity(group_1);
    expect(members_1.includes(constants.GH_USERS["admin"].name)).toBe(true);

    // check team2
    const group_2: GroupEntity = await api.getGroupEntityFromAPI(
      constants.GH_TEAMS["team_2"].name,
    );
    const members_2 = parseGroupMemberFromEntity(group_2);
    expect(members_2).toEqual([]);

    const children_2 = parseGroupChildrenFromEntity(group_2);
    expect(children_2.includes(constants.GH_TEAMS["team_3"].name)).toBe(true);

    // check team3
    const group_3: GroupEntity = await api.getGroupEntityFromAPI(
      constants.GH_TEAMS["team_3"].name,
    );
    const members_3 = parseGroupMemberFromEntity(group_3);
    expect(members_3.includes(constants.GH_USERS["user_1"].name)).toBe(true);
    const parent_3 = parseGroupParentFromEntity(group_3);
    expect(parent_3.includes(constants.GH_TEAMS["team_2"].name)).toBe(true);

    // check team4
    const group_4: GroupEntity = await api.getGroupEntityFromAPI(
      constants.GH_TEAMS["team_4"].name,
    );
    const members_4 = parseGroupMemberFromEntity(group_4);
    expect(members_4.includes(constants.GH_USERS["user_1"].name)).toBe(true);

    // check location_admin
    const location_admin: GroupEntity = await api.getGroupEntityFromAPI(
      constants.GH_TEAMS["team_4"].name,
    );
    const members_location_admin = parseGroupMemberFromEntity(location_admin);
    expect(
      members_location_admin.includes(constants.GH_USERS["admin"].name),
    ).toBe(true);
  });

  test("Remove a user from RHDH", async () => {
    test.setTimeout(300 * 1000);

    // remove user from RHDH -> authentication works, access is broken
    logger.info(
      `Executing testcase: Remove a user from RHDH: authentication should work, but access is denied before next sync.`,
    );

    logger.info("Unregistering user 3 from catalog");
    await common.UnregisterUserEntityFromCatalog(
      constants.GH_USERS["user_1"].name,
      constants.STATIC_API_TOKEN,
    );

    await expect(async () => {
      expect(
        await common.CheckUserIsIngestedInCatalog(
          [constants.GH_USERS["user_1"].name],
          constants.STATIC_API_TOKEN,
        ),
      ).toBe(false);
    }).toPass({
      intervals: [1_000, 2_000, 5_000],
      timeout: 60 * 1000,
    });

    const loginSucceded = await common.githubLogin(
      constants.GH_USERS["user_1"].name,
      constants.GH_USER_PASSWORD,
    );
    expect(loginSucceded).toContain("Login successful");

    await uiHelper.verifyAlertErrorMessage(/User not found/gm);

    await context.clearCookies();

    // waiting for next sync
    await WaitForNextSync(SYNC_TIME, "github");

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

    // remove group from RHDH -> user can login, but policy is broken
    logger.info(
      `Executing testcase: Remove a group from RHDH: user can login, but policy is broken before next sync.`,
    );

    await common.UnregisterGroupEntityFromCatalog(
      constants.GH_TEAMS["team_1"].name,
      constants.STATIC_API_TOKEN,
    );

    await expect(async () => {
      expect(
        await common.CheckGroupIsIngestedInCatalog(
          [constants.GH_TEAMS["team_1"].name],
          constants.STATIC_API_TOKEN,
        ),
      ).toBe(false);
    }).toPass({
      intervals: [1_000, 2_000, 5_000],
      timeout: 60 * 1000,
    });

    // waiting for next sync
    await WaitForNextSync(SYNC_TIME, "github");

    // after sync, ensure group is created again and memembers can login
    logger.info(
      `Execute testcase: Remove a group from RHDH: group is created again after the sync`,
    );

    await expect(async () => {
      expect(
        await common.CheckGroupIsIngestedInCatalog(
          [constants.GH_TEAMS["team_1"].name],
          constants.STATIC_API_TOKEN,
        ),
      ).toBe(true);
    }).toPass({
      intervals: [1_000, 2_000, 5_000],
      timeout: 60 * 1000,
    });
  });

  test("Move a user to another group in Github", async () => {
    test.setTimeout(300 * 1000);
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

    let apiToken;
    const api = new APIHelper();
    api.UseStaticToken(constants.STATIC_API_TOKEN);

    await expect(async () => {
      apiToken = await RhdhAuthHack.getInstance().getApiToken(page);
      expect(apiToken).not.toBeUndefined();
      const statusBefore = await api.scheduleEntityRefreshFromAPI(
        "example",
        "location",
        apiToken,
      );
      logger.info(
        `Checking user can schedule location refresh. API returned ${JSON.stringify(statusBefore)}`,
      );
      expect(statusBefore).toBe(403);
    }).toPass({
      intervals: [1_000, 2_000, 5_000],
      timeout: 90 * 1000,
    });

    await uiHelper.openSidebar("Settings");
    await common.signOut();

    await WaitForNextSync(SYNC_TIME, "github");

    // ensure the change is mirrored in the catalog
    logger.info(
      `Execute testcase: Move a user to another group in Github: change should be mirrored and permission should be updated after the sync`,
    );

    // location_admin should show user_2
    const group: GroupEntity = await api.getGroupEntityFromAPI(
      constants.GH_TEAMS["location_admin"].name,
    );
    const members = parseGroupMemberFromEntity(group);
    expect(members.includes(constants.GH_USERS["user_1"].name)).toBe(true);

    await common.githubLogin(
      constants.GH_USERS["user_1"].name,
      constants.GH_USER_PASSWORD,
    );

    // check RBAC permissions are updated after group update
    // new group should allow user to schedule location refresh and unregister the entity

    await expect(async () => {
      await page.goto("/");
      await uiHelper.verifyHeading("Welcome");

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
    }).toPass({
      intervals: [1_000, 2_000, 5_000],
      timeout: 60 * 1000,
    });

    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies();
  });

  test("Remove a group from Github", async () => {
    test.setTimeout(300 * 1000);

    // remove a group -> members still exists, member should still login
    logger.info(
      `Executing testcase: Remove a group from Github: ensure group and its members still exists, member should still login before next sync.`,
    );

    await ghHelper.deleteTeam(
      constants.GH_TEAMS["team_4"].name,
      constants.AUTH_PROVIDERS_GH_ORG_NAME,
    );

    // team should exist in rhdh
    await expect(async () => {
      expect(
        await common.CheckGroupIsIngestedInCatalog(
          [constants.GH_TEAMS["team_4"].name],
          constants.STATIC_API_TOKEN,
        ),
      ).toBe(true);
    }).toPass({
      intervals: [1_000, 2_000, 5_000],
      timeout: 60 * 1000,
    });

    // waiting for next sync
    await WaitForNextSync(SYNC_TIME, "github");

    // after the sync ensure the group entity is removed
    logger.info(
      `Execute testcase: Remove a group from Github: group should be removed and permissions should default to read-only after the sync.`,
    );

    await expect(async () => {
      expect(
        await common.CheckGroupIsIngestedInCatalog(
          [constants.GH_USERS["user_1"].name],
          constants.STATIC_API_TOKEN,
        ),
      ).toBe(false);
    }).toPass({
      intervals: [5_000, 20_000],
      timeout: 80 * 1000,
    });

    // users permission based on that group will be defaulted to read-only
    // expect user not to see catalog entities
    await common.githubLogin(
      constants.GH_USERS["user_1"].name,
      constants.GH_USER_PASSWORD,
    );

    await expect(async () => {
      await page.goto("/");
      const navMyGroup = page.locator(`nav a:has-text("My Group")`);
      await expect(navMyGroup).toHaveCount(0);
    }).toPass({
      intervals: [2_000, 5_000],
      timeout: 30 * 1000,
    });

    await uiHelper.openSidebar("Settings");
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user
  });

  test("Rename a user and a group", async () => {
    test.setTimeout(600 * 1000);
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
    await WaitForNextSync(SYNC_TIME, "github");

    // after sync, ensure group is mirrored
    logger.info(
      `Execute testcase: Rename a user and a group: changes are mirrored in RHDH but permissions should be broken after the sync`,
    );

    await expect(async () => {
      expect(
        await common.CheckGroupIsIngestedInCatalog(
          [constants.MSGRAPH_GROUPS["group_6"].displayName + "_renamed"],
          constants.STATIC_API_TOKEN,
        ),
      ).toBe(true);
      expect(
        await common.CheckUserIsIngestedInCatalog(
          [constants.GH_TEAMS["team_2"].name + "_renamed"],
          constants.STATIC_API_TOKEN,
        ),
      ).toBe(true);
    }).toPass({
      intervals: [5_000, 10_000],
      timeout: 60 * 1000,
    });

    await common.githubLogin(
      constants.GH_USERS["user_1"].name,
      constants.GH_USER_PASSWORD,
    );

    // users permission based on that group will be defaulted to read-only
    // expect user not to see catalog entities
    await expect(async () => {
      await page.goto("/");
      const navMyGroup = page.locator(`nav a:has-text("My Group")`);
      await expect(navMyGroup).toHaveCount(0);
    }).toPass({
      intervals: [2_000, 5_000],
      timeout: 30 * 1000,
    });

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
        timeout: 5000,
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

  test.afterEach(async () => {
    if (test.info().status !== test.info().expectedStatus) {
      const prefix = `${test.info().testId}_${test.info().retry}`;
      logger.info(`Dumping logs with prefix ${prefix}`);
      await dumpAllPodsLogs(prefix, constants.LOGS_FOLDER);
      await dumpRHDHUsersAndGroups(prefix, constants.LOGS_FOLDER);
      MUST_SYNC = true;
    }
  });

  test.beforeEach(async () => {
    test.setTimeout(120 * 1000);
    if (test.info().retry > 0 || MUST_SYNC) {
      logger.info(
        `Waiting for sync. Retry #${test.info().retry}. Needed sync after failure: ${MUST_SYNC}.`,
      );
      await WaitForNextSync(SYNC_TIME, "microsoft");
      MUST_SYNC = false;
    }
  });
});
