import { test, Page, expect } from '@playwright/test';
import { Common, setupBrowser } from '../../utils/Common';
import { UIhelper } from '../../utils/UIhelper';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import * as constants from '../../utils/authenticationProviders/constants';
import { logger } from '../../utils/authenticationProviders/Logger';
import GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation';
import {
  upgradeHelmChartWithWait,
  WaitForNextSync,
  k8sClient,
  ensureEnvSecretExists,
  ensureNewPolicyConfigMapExists,
} from '../../utils/authenticationProviders/helper';
import * as rhssoHelper from '../../utils/authenticationProviders/rhssoHelper';

let page: Page;

test.beforeAll('Prepare environment for RHSSO 7.6', async () => {
  await k8sClient.createNamespaceIfNotExists(
    constants.AUTH_PROVIDERS_NAMESPACE,
  );
  await ensureNewPolicyConfigMapExists(
    'rbac-policy',
    constants.AUTH_PROVIDERS_NAMESPACE,
  );
  await ensureEnvSecretExists(
    'rhdh-secrets',
    constants.AUTH_PROVIDERS_NAMESPACE,
  );
});

test.describe('Standard authentication providers: OIDC with RHSSO 7.6', () => {
  let common: Common;
  let uiHelper: UIhelper;
  let usersCreated: Map<string, UserRepresentation>;
  let groupsCreated: Map<string, GroupRepresentation>;
  const SYNC__TIME = 60;

  test.beforeAll(async ({ browser }, testInfo) => {
    if (testInfo.retry > 0) {
      logger.info(`Retry #${testInfo.retry}.`);
    }
    logger.info(
      'Staring scenario: Standard authentication providers: OIDC with RHSSO 7.6',
    );
    expect(process.env.BASE_URL).not.toBeNull();
    logger.info(`Base Url is ${process.env.BASE_URL}`);

    page = (await setupBrowser(browser, testInfo)).page;
    common = new Common(page);
    uiHelper = new UIhelper(page);

    await rhssoHelper.initializeRHSSOClient(rhssoHelper.connectionConfig);
    const created = await rhssoHelper.setupRHSSOEnvironment();
    usersCreated = created.usersCreated;
    groupsCreated = created.groupsCreated;
  });

  test.afterAll(async () => {
    // DUMP LOGS TO FILE
    // source .ibm/pipelines/openshift-ci-tests.sh && save_all_pod_logs $namespace
    // or run script
    //#!/bin/bash
    //. ~/lib/testlib.src
    //one
    //two
  });

  test('Default resolver for RHSSO should be emailLocalPartMatchingUserEntityName: user_1 should authenticate, user_2 should not', async () => {
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
      [
        '--set global.dynamic.plugins[0].disabled=false',
        '--set upstream.postgresql.primary.persistence.enabled=false',
        '--set upstream.backstage.appConfig.catalog.providers.githubOrg=null',
        '--set upstream.backstage.appConfig.catalog.providers.microsoftOrg=null',
      ],
    );

    await WaitForNextSync(SYNC__TIME, 'rhsso');

    await common.keycloakLogin(
      constants.RHSSO76_USERS['user_1'].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await uiHelper.openSidebar('Settings');
    await uiHelper.verifyHeading(
      `${constants.RHSSO76_USERS['user_1'].firstName} ${constants.RHSSO76_USERS['user_1'].lastName}`,
    );
    await common.signOut();

    await common.keycloakLogin(
      constants.RHSSO76_USERS['user_2'].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await uiHelper.verifyAlertErrorMessage(
      'Login failed; caused by NotFoundError: User not found',
    );

    await rhssoHelper.clearUserSessions(
      constants.RHSSO76_USERS['user_2'].username,
      constants.AUTH_PROVIDERS_REALM_NAME,
    );
  });

  test('Testing resolver emailMatchingUserEntityProfileEmail: user_1 should authenticate, jdoe should not', async () => {
    test.setTimeout(600 * 1000);
    logger.info(
      'Executing testcase: Testing resolver emailMatchingUserEntityProfileEmail: user_1 should authenticate, jdoe should not',
    );
    // updating the resolver
    // disable keycloak plugin to disable ingestion
    // edit jdoe user in keycloak to have a different email than the synced one: it will not be synced

    await upgradeHelmChartWithWait(
      constants.AUTH_PROVIDERS_RELEASE,
      constants.AUTH_PROVIDERS_CHART,
      constants.AUTH_PROVIDERS_NAMESPACE,
      constants.AUTH_PROVIDERS_VALUES_FILE,
      [
        '--set global.dynamic.plugins[0].disabled=false',
        '--set global.dynamic.plugins[1].disabled=true',
        '--set global.dynamic.plugins[2].disabled=true',
        '--set upstream.postgresql.primary.persistence.enabled=false',
        '--set upstream.backstage.appConfig.auth.providers.oidc.production.signIn.resolvers[0].resolver=emailMatchingUserEntityProfileEmail',
      ],
    );

    await WaitForNextSync(SYNC__TIME, 'rhsso');

    // emailMatchingUserEntityProfileEmail should only allow authentication of keycloak users that match the email attribute with the entity one.
    // update jdoe email -> login should fail with error Login failed; caused by Error: Failed to sign-in, unable to resolve user identity
    await rhssoHelper.updateUserEmail(
      constants.RHSSO76_USERS['jenny_doe'].username,
      constants.JDOE_NEW_EMAIL,
    );

    // login with testuser1 -> login should succeed
    logger.info(
      `Login with user ${constants.RHSSO76_USERS['user_1'].username}`,
    );
    await common.keycloakLogin(
      constants.RHSSO76_USERS['user_1'].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await uiHelper.openSidebar('Settings');
    await uiHelper.verifyHeading(
      `${constants.RHSSO76_USERS['user_1'].firstName} ${constants.RHSSO76_USERS['user_1'].lastName}`,
    );
    await common.signOut();

    // login with jenny doe -> should fail
    logger.info(
      `Login with user ${constants.RHSSO76_USERS['jenny_doe'].username}`,
    );
    await common.keycloakLogin(
      constants.RHSSO76_USERS['jenny_doe'].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await uiHelper.verifyAlertErrorMessage(
      'Login failed; caused by Error: Failed to sign-in, unable to resolve user identity',
    );
    await rhssoHelper.clearUserSessions(
      constants.RHSSO76_USERS['jenny_doe'].username,
      constants.AUTH_PROVIDERS_REALM_NAME,
    );
  });

  test('Testing resolver preferredUsernameMatchingUserEntityName: user_1 and jenny_doe should both authenticate', async () => {
    test.setTimeout(600 * 1000);
    logger.info(
      'Executing testcase: Testing resolver preferredUsernameMatchingUserEntityName: user_1 and jenny_doe should both authenticate',
    );
    // updating the resolver
    // disable keycloak plugin to disable ingestion

    await upgradeHelmChartWithWait(
      constants.AUTH_PROVIDERS_RELEASE,
      constants.AUTH_PROVIDERS_CHART,
      constants.AUTH_PROVIDERS_NAMESPACE,
      constants.AUTH_PROVIDERS_VALUES_FILE,
      [
        '--set global.dynamic.plugins[0].disabled=false',
        '--set global.dynamic.plugins[1].disabled=true',
        '--set global.dynamic.plugins[2].disabled=true',
        '--set upstream.postgresql.primary.persistence.enabled=false',
        '--set upstream.backstage.appConfig.auth.providers.oidc.production.signIn.resolvers[0].resolver=preferredUsernameMatchingUserEntityName',
      ],
    );

    // preferredUsernameMatchingUserEntityName should allow authentication of any keycloak.

    await WaitForNextSync(SYNC__TIME, 'rhsso');

    // login with testuser1 -> login should succeed
    logger.info(
      `Login with user ${constants.RHSSO76_USERS['user_1'].username}`,
    );
    await common.keycloakLogin(
      constants.RHSSO76_USERS['user_1'].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await uiHelper.openSidebar('Settings');
    await uiHelper.verifyHeading(
      `${constants.RHSSO76_USERS['user_1'].firstName} ${constants.RHSSO76_USERS['user_1'].lastName}`,
    );
    await common.signOut();

    // login with jenny doe -> should succeed
    logger.info(
      `Login with user ${constants.RHSSO76_USERS['jenny_doe'].username}`,
    );
    await common.keycloakLogin(
      constants.RHSSO76_USERS['jenny_doe'].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await uiHelper.openSidebar('Settings');
    await uiHelper.verifyHeading(
      `${constants.RHSSO76_USERS['jenny_doe'].firstName} ${constants.RHSSO76_USERS['jenny_doe'].lastName}`,
    );
    await common.signOut();

    // login with user_2 -> should succeed
    logger.info(
      `Login with user ${constants.RHSSO76_USERS['user_2'].username}`,
    );
    await common.keycloakLogin(
      constants.RHSSO76_USERS['user_2'].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await uiHelper.openSidebar('Settings');
    await uiHelper.verifyHeading(
      `${constants.RHSSO76_USERS['user_2'].firstName} ${constants.RHSSO76_USERS['user_2'].lastName}`,
    );
    await common.signOut();
  });

  test('Ingestion of Users and Nested Groups: verify the UserEntities and Groups are created with the correct relationships in RHDH', async () => {
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC__TIME, 'rhsso');
    }
    await common.keycloakLogin(
      constants.RHSSO76_USERS['user_1'].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    // check entities are in the catalog
    const usersDisplayNames = Object.values(constants.RHSSO76_USERS).map(
      u => u.firstName + ' ' + u.lastName,
    );
    logger.info(
      `Check users are in the catalog: ${usersDisplayNames.join(', ')}`,
    );

    await common.CheckUserIsShowingInCatalog(usersDisplayNames);

    // check groups are nested correctly and display all members
    const groupsDisplayNames = Object.values(constants.RHSSO76_GROUPS).map(
      g => g.name,
    );
    groupsDisplayNames.push(constants.RHSSO76_NESTED_GROUP.name);
    logger.info(
      `Check groups are in the catalog: ${groupsDisplayNames.join(', ')}`,
    );
    await common.CheckGroupIsShowingInCatalog(groupsDisplayNames);

    let displayed;

    // group_1 should show user_1
    displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.RHSSO76_GROUPS['group_1'].name,
    );
    logger.log({
      level: 'info',
      message: `Checking group ${constants.RHSSO76_GROUPS['group_1'].name} is created correctly`,
      dump: displayed,
    });

    expect(displayed.groupMembers).toContain(
      constants.RHSSO76_USERS['user_1'].firstName +
        ' ' +
        constants.RHSSO76_USERS['user_1'].lastName,
    );

    // group_2 should show user_2 and parent group_nested
    displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.RHSSO76_GROUPS['group_2'].name,
    );
    logger.log({
      level: 'info',
      message: `Checking group ${constants.RHSSO76_GROUPS['group_2'].name} is created correctly`,
      dump: JSON.stringify(displayed),
    });

    expect(displayed.groupMembers).toContain(
      constants.RHSSO76_USERS['user_2'].firstName +
        ' ' +
        constants.RHSSO76_USERS['user_2'].lastName,
    );
    expect(displayed.childGroups).toContain(
      constants.RHSSO76_NESTED_GROUP.name,
    );

    // group_nested should show user_3
    displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.RHSSO76_NESTED_GROUP.name,
    );
    logger.log({
      level: 'info',
      message: `Checking group ${constants.RHSSO76_NESTED_GROUP.name} is created correctly`,
      dump: JSON.stringify(displayed),
    });

    expect(displayed.groupMembers).toContain(
      constants.RHSSO76_USERS['user_3'].firstName +
        ' ' +
        constants.RHSSO76_USERS['user_3'].lastName,
    );
    expect(displayed.parentGroup).toContain(
      constants.RHSSO76_GROUPS['group_2'].name,
    );

    // logout
    await uiHelper.openSidebar('Settings');
    await common.signOut();
  });

  test('Remove user from RHSSO', async () => {
    // remove user from azure -> ensure authentication fails
    test.setTimeout(300 * 1000);
    logger.info(`Executing testcase: Remove user from RHSSO`);
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC__TIME, 'rhsso');
    }
    await rhssoHelper.deleteUser(usersCreated['user_1'].id);
    await page.waitForTimeout(2000); // give rhsso a few seconds
    await common.keycloakLogin(
      constants.RHSSO76_USERS['user_1'].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    await WaitForNextSync(SYNC__TIME, 'rhsso');

    await common.keycloakLogin(
      constants.RHSSO76_USERS['user_2'].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    await expect(
      common.CheckUserIsShowingInCatalog([
        constants.RHSSO76_USERS['user_1'].firstName +
          ' ' +
          constants.RHSSO76_USERS['user_1'].lastName,
      ]),
    ).rejects.toThrow();

    const displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.RHSSO76_GROUPS['group_1'].name,
    );
    logger.log({
      level: 'info',
      message: `Checking group ${constants.RHSSO76_GROUPS['group_1'].name} does not show user_1 anymore`,
      dump: JSON.stringify(displayed),
    });
    expect(displayed.groupMembers).not.toContain(
      constants.RHSSO76_USERS['user_1'].firstName +
        ' ' +
        constants.RHSSO76_USERS['user_1'].lastName,
    );
    await uiHelper.openSidebar('Settings');
    await common.signOut();
  });

  test('Move a user to another group in RHSSO', async () => {
    test.setTimeout(300 * 1000);

    // move a user to another group -> ensure user can still login
    // move user_3 to group_3
    logger.info(
      `Executing testcase: Move a user to another group in Microsoft EntraID: user should still login before next sync.`,
    );
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC__TIME, 'rhsso');
    }

    await rhssoHelper.removeUserFromGroup(
      usersCreated['user_3'].id,
      groupsCreated['group_4'].id,
    );
    await rhssoHelper.addUserToGroup(
      usersCreated['user_3'].id,
      groupsCreated['group_3'].id,
    );

    await common.keycloakLogin(
      constants.RHSSO76_USERS['user_3'].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    // logout
    await uiHelper.openSidebar('Settings');
    await common.signOut();

    await WaitForNextSync(SYNC__TIME, 'rhsso');

    // ensure the change is mirrored in the catalog
    logger.info(
      `Execute testcase: Move a user to another group in RHSSO: change should be mirrored and permission should be updated after the sync`,
    );
    await common.keycloakLogin(
      constants.RHSSO76_USERS['user_3'].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    const displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.RHSSO76_GROUPS['group_3'].name,
    );
    logger.log({
      level: 'info',
      message: `Checking group ${constants.RHSSO76_GROUPS['group_3'].name} now shows user_3`,
      dump: displayed,
    });
    expect(displayed.groupMembers).toContain(
      constants.RHSSO76_USERS['user_3'].firstName +
        ' ' +
        constants.RHSSO76_USERS['user_3'].lastName,
    );

    await uiHelper.openSidebar('Settings');
    await common.signOut();

    // configure policy permissions different for the two groups
    // after the sync, ensure the permission also reflect the user move
    // TBD: add RBAC test
  });

  test('Remove a group from RHSSO', async () => {
    test.setTimeout(300 * 1000);

    // remove a group -> ensure group and its members still exists, member should still login
    // remove group_3
    logger.info(
      `Executing testcase: Remove a group from RHSSO: ensure group and its members still exists, member should still login before next sync.`,
    );
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC__TIME, 'rhsso');
    }
    await rhssoHelper.deleteGroup(groupsCreated['group_4'].id);
    await common.keycloakLogin(
      constants.RHSSO76_USERS['user_4'].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    await uiHelper.openSidebar('Settings');
    await common.signOut();

    await WaitForNextSync(SYNC__TIME, 'rhsso');

    // after the sync ensure the group entity is removed
    logger.info(
      `Execute testcase: Remove a group from RHSSO: group should be removed and permissions should default to read-only after the sync.`,
    );
    await common.keycloakLogin(
      constants.RHSSO76_USERS['user_2'].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    await expect(
      common.CheckGroupIsShowingInCatalog([
        constants.RHSSO76_GROUPS['group_4'].name,
      ]),
    ).rejects.toThrow();
    await uiHelper.openSidebar('Settings');
    await common.signOut();

    // users permission based on that group will be defaulted to read-only
    // TBD: add RBAC test
  });

  test('Remove a user from RHDH', async () => {
    test.setTimeout(300 * 1000);

    // remove user from RHDH -> authentication works, access is broken
    logger.info(
      `Executing testcase: Remove a user from RHDH: authentication should work, but access is denied before next sync.`,
    );
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC__TIME, 'rhsso');
    }
    logger.info('Login with user 3');
    await common.keycloakLogin(
      constants.RHSSO76_USERS['admin'].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    logger.info('Unregistering user 4 from catalog');
    await common.UnregisterUserEnittyFromCatalog(
      constants.RHSSO76_USERS['user_4'].firstName +
        ' ' +
        constants.RHSSO76_USERS['user_4'].lastName,
    );
    logger.info('Checking alert message after login');
    await uiHelper.verifyAlertErrorMessage(/Removed entity/gm);

    await expect(async () => {
      await common.CheckUserIsShowingInCatalog([
        constants.RHSSO76_USERS['user_4'].firstName +
          ' ' +
          constants.RHSSO76_USERS['user_4'].lastName,
      ]);
    }).not.toPass({
      intervals: [1_000, 2_000, 5_000],
      timeout: 20 * 1000,
    });

    logger.info('Logging out');

    await uiHelper.openSidebar('Settings');
    await common.signOut();

    logger.info('Login user 4');
    const loginSucceded = await common.keycloakLogin(
      constants.RHSSO76_USERS['user_4'].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    expect(loginSucceded).toContain('Login successful');

    await uiHelper.verifyAlertErrorMessage(/unable to resolve user identity/gm);

    // clear user sessions
    logger.info('Clear user 4 sessions');
    await rhssoHelper.clearUserSessions(
      constants.RHSSO76_USERS['user_4'].username,
      constants.AUTH_PROVIDERS_REALM_NAME,
    );

    logger.info('Wait for next sync');
    await WaitForNextSync(SYNC__TIME, 'rhsso');

    logger.info(
      `Execute testcase: Remove a user from RHDH: user is re-created and can login after the sync`,
    );
    await common.keycloakLogin(
      constants.RHSSO76_USERS['user_4'].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await common.CheckUserIsShowingInCatalog([
      constants.RHSSO76_USERS['user_4'].firstName +
        ' ' +
        constants.RHSSO76_USERS['user_4'].lastName,
    ]);
    await uiHelper.openSidebar('Settings');
    await common.signOut();
  });

  test('Remove a group from RHDH', async () => {
    test.setTimeout(300 * 1000);

    // remove group from RHDH -> user can login, but policy is broken
    logger.info(
      `Executing testcase: Remove a group from RHDH: user can login, but policy is broken before next sync.`,
    );
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC__TIME, 'rhsso');
    }
    await common.keycloakLogin(
      constants.RHSSO76_USERS['user_3'].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    await common.UnregisterGroupEnittyFromCatalog(
      constants.RHSSO76_GROUPS['group_3'].name,
    );

    await uiHelper.verifyAlertErrorMessage(/Removed entity/gm);

    await expect(
      common.CheckGroupIsShowingInCatalog([
        constants.RHSSO76_GROUPS['group_3'].name,
      ]),
    ).rejects.toThrow(/Expected at least one cell/);

    await uiHelper.openSidebar('Settings');
    await common.signOut();

    await WaitForNextSync(SYNC__TIME, 'rhsso');

    // after sync, ensure group_5 is created again and memembers can login
    logger.info(
      `Execute testcase: Remove a group from RHDH: group is created again after the sync`,
    );
    await common.keycloakLogin(
      constants.RHSSO76_USERS['user_4'].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await common.CheckGroupIsShowingInCatalog([
      constants.RHSSO76_GROUPS['group_3'].name,
    ]);
    await uiHelper.openSidebar('Settings');
    await common.signOut();
  });

  test('Rename a user and a group', async () => {
    test.setTimeout(300 * 1000);

    // RHSSO
    logger.info(`Executing testcase: Rename a user and a group.`);
    if (test.info().retry > 0) {
      await WaitForNextSync(SYNC__TIME, 'rhsso');
    }
    await rhssoHelper.updateUser(usersCreated['user_2'].id, {
      lastName: constants.RHSSO76_USERS['user_2'].lastName + ' Renamed',
      emailVerified: true,
      email: constants.RHSSO76_USERS['user_2'].username + '@rhdh.com',
    });

    await rhssoHelper.updateGruop(groupsCreated['group_2'].id, {
      name: constants.RHSSO76_GROUPS['group_2'].name + '_renamed',
    });

    await WaitForNextSync(SYNC__TIME, 'rhsso');

    // after sync, ensure group is mirrored
    // after sync, ensure user change is mirrorred
    logger.info(
      `Execute testcase: Rename a user and a group: changes are mirrored in RHDH but permissions should be broken after the sync`,
    );
    await common.keycloakLogin(
      constants.RHSSO76_USERS['user_2'].username,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await common.CheckUserIsShowingInCatalog([
      constants.RHSSO76_USERS['user_2'].firstName +
        ' ' +
        constants.RHSSO76_USERS['user_2'].lastName +
        ' Renamed',
    ]);
    await common.CheckGroupIsShowingInCatalog([
      constants.RHSSO76_GROUPS['group_2'].name + '_renamed',
    ]);
    await uiHelper.openSidebar('Settings');
    await common.signOut();

    // after rename, permission should be broken
    // update permission with the new group name
    // ensure user can now login
    // TBD: add RBAC test

    // after sync, ensure group is mirrored
    // after rename, permission should be broken
    // update permission with the new group name
    // ensure user can now login
    // after sync, ensure user  change is mirrorred
    // TBD: add RBAC test
  });

  test('configmap', async () => {
    console.log('test');
  });
});
