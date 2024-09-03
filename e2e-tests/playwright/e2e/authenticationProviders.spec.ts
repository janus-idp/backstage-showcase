import { test, Page, expect } from '@playwright/test';
import { Common, setupBrowser } from '../utils/Common';
import { exec } from 'child_process';
import { UIhelper } from '../utils/UIhelper';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import * as constants from '../utils/authenticationProviders/constants';
import { Credentials } from '@keycloak/keycloak-admin-client/lib/utils/auth';
import { logger } from '../utils/Logger';
import * as graphHelper from '../utils/authenticationProviders/graphHelper';
import { User, Group } from '@microsoft/microsoft-graph-types';
import { BrowserContext } from '@playwright/test';

let page: Page;

async function runShellCmd(command: string) {
  return new Promise<string>((resolve, reject) => {
    logger.info(`Executing command ${command}`);
    const process = exec(command);
    let result: string;
    process.stdout.on('data', data => {
      result = data;
    });
    process.stderr.on('data', data => {
      logger.log({
        level: 'error',
        message: `Error executing command ${command}`,
        dump: data,
      });
      reject();
    });
    process.on('exit', () => resolve(result));
  });
}

async function upgradeHelmChartWithWait(
  RELEASE: string,
  CHART: string,
  NAMESPACE: string,
  VALUES: string,
  FLAGS: Array<string>,
) {
  logger.info(
    `Upgrading helm release ${RELEASE}: using chart ${CHART} in namespace ${NAMESPACE} with values file ${VALUES} applying flags ${FLAGS.join(' ')}`,
  );
  const upgradeOutput = await runShellCmd(`helm upgrade \
    -i ${RELEASE} ${CHART} \
    --wait --timeout 300s -n ${NAMESPACE} \
    --values ${VALUES} \
    ${FLAGS.join(' ')}`);

  logger.log({
    level: 'info',
    message: `Release upgrade returned: `,
    dump: upgradeOutput,
  });

  logger.info('Getting applied configmap for release upgrade');
  const configmap = await runShellCmd(
    `oc get configmap ${RELEASE}-backstage-app-config -n ${NAMESPACE} -o jsonpath='{.data.app-config\\.yaml}'`,
  );

  logger.log({
    level: 'info',
    message: `Applied configMap for release upgrade: `,
    dump: configmap,
  });
}

async function deleteHelmReleaseWithWait(RELEASE: string, NAMESPACE: string) {
  logger.info(`Deleting release ${RELEASE} in namespace ${NAMESPACE}`);
  const result = await runShellCmd(
    `helm uninstall ${RELEASE} --wait --timeout 300s -n ${NAMESPACE}`,
  );
  logger.log({
    level: 'info',
    message: `Release delete returned: `,
    dump: result,
  });
  return result;
}

async function dumpPodLog(POD: string, NAMESPACE: string) {
  logger.info(`Getting dump of logs for pod ${POD} in ${NAMESPACE}`);
  const logs = await runShellCmd(
    `oc logs ${POD} -n ${NAMESPACE} --all-containers`,
  );
  logger.log({
    level: 'info',
    message: `Pod ${POD} logs dump:`,
    dump: logs,
  });
}

async function getLastSyncTimeFromLogs(
  provider: string,
  syncTimeInSeconds: number,
) {
  let searchString = 'Reading msgraph users and groups';
  if (provider == 'microsoft') {
    searchString = 'Reading msgraph users and groups';
  }
  try {
    const podName = await runShellCmd(
      `oc get pods -n ${constants.AUTH_PROVIDERS_NAMESPACE} | awk '{print $1}' | grep '^${constants.AUTH_PROVIDERS_POD_STRING}'`,
    );
    const log = await runShellCmd(
      `oc logs ${podName.trim()} -n ${constants.AUTH_PROVIDERS_NAMESPACE} -c backstage-backend | grep "${searchString}" | tail -n1`,
    );
    const syncObj = {
      lastSync: JSON.parse(log).timestamp,
      nextSyncIn: () => {
        const now = new Date(Date.now());
        const lastSyncDate = new Date(JSON.parse(log).timestamp);
        return (
          syncTimeInSeconds -
          ((Math.abs(+now - +lastSyncDate) / 1000) % syncTimeInSeconds)
        );
      },
    };
    return syncObj;
  } catch (e) {
    logger.error(JSON.stringify(e));
    return null;
  }
}

test.describe.skip(
  'Standard authentication providers: Basic authentication',
  () => {
    let common: Common;
    let uiHelper: UIhelper;

    test.beforeAll(async ({ browser }, testInfo) => {
      page = (await setupBrowser(browser, testInfo)).page;
      common = new Common(page);
      uiHelper = new UIhelper(page);
      expect(process.env.BASE_URL).not.toBeNull();
      logger.info(`Base Url is ${process.env.BASE_URL}`);
      logger.info(
        'Starting scenario: Standard authentication providers: Basic authentication',
      );
    });

    test.afterAll(async () => {
      test.setTimeout(300 * 1000);
      const podName = await runShellCmd(
        `oc get pods -n ${constants.AUTH_PROVIDERS_NAMESPACE} | awk '{print $1}' | grep '^${constants.AUTH_PROVIDERS_POD_STRING}'`,
      );
      await dumpPodLog(podName.trim(), constants.AUTH_PROVIDERS_NAMESPACE);
      await deleteHelmReleaseWithWait(
        constants.AUTH_PROVIDERS_RELEASE,
        constants.AUTH_PROVIDERS_NAMESPACE,
      );
      logger.info(
        'Ending scenario: Standard authentication providers: Basic authentication',
      );
      // close tab page
      page.close();
    });

    test('1. Verify guest login can work when no auth provider is configured (dangerouslyAllowSignInWithoutUserInCatalog is enabled by default but it should not conflict with the guest login).', async () => {
      test.setTimeout(300 * 1000);
      logger.info(
        'Executing testcase: Verify guest login can work when no auth provider is configured (dangerouslyAllowSignInWithoutUserInCatalog is enabled by default but it should not conflict with the guest login).',
      );

      await upgradeHelmChartWithWait(
        constants.AUTH_PROVIDERS_RELEASE,
        constants.AUTH_PROVIDERS_CHART,
        constants.AUTH_PROVIDERS_NAMESPACE,
        constants.AUTH_PROVIDERS_VALUES_FILE,
        [
          '--set upstream.backstage.appConfig.auth.providers=null',
          '--set upstream.backstage.appConfig.auth.environment=development',
          '--set upstream.backstage.appConfig.catalog.providers=null',
        ],
      );

      // Guest login should work
      logger.info('Ensure Guest login works');
      await common.loginAsGuest();
      await uiHelper.openSidebar('Settings');
      await uiHelper.verifyHeading('Guest');
      await uiHelper.openSidebar('Settings');
      logger.info('Sign Guest out');
      await common.signOut();
    });

    test('2. Login should fail when an authProvider is configured without the ingester.', async () => {
      // Update cofiguration to setup authentication providers, but no ingesters
      // Only providers using the 'signInWithCatalogUserOptionalmethod' to sign in are affected by the 'dangerouslyAllowSignInWoutUserInCatalog' setting
      // At the moment, Microsoft yes, oidc no, github (yes by default, ingestion is not working)
      // Since no ingester is configured for Microsoft Auth Provider, the login should fail with the error:
      // "Login failed; caused by Error: Sign in failed: users/groups have not been ingested into the catalog. Please refer to the authentication provider docs for more information on how to ingest users/groups to the catalog with the appropriate entity provider."

      test.setTimeout(300 * 1000);
      logger.info(
        'Executing testcase: Login should fail when an authProvider is configured without the ingester.',
      );

      await upgradeHelmChartWithWait(
        constants.AUTH_PROVIDERS_RELEASE,
        constants.AUTH_PROVIDERS_CHART,
        constants.AUTH_PROVIDERS_NAMESPACE,
        constants.AUTH_PROVIDERS_VALUES_FILE,
        [
          '--set upstream.backstage.appConfig.auth.environment=development',
          '--set upstream.backstage.appConfig.signInPage=microsoft',
          '--set upstream.backstage.appConfig.catalog.providers=null',
        ],
      );

      logger.info('Sign in using Microsoft Azure login');
      await common.MicrosoftAzureLogin(
        constants.AZURE_LOGIN_USERNAME,
        constants.AZURE_LOGIN_PASSWORD,
      );

      const alert = page.getByRole('alert');
      await alert.waitFor();
      await expect(alert).toHaveText(
        'Login failed; caused by Error: Sign in failed: users/groups have not been ingested into the catalog. Please refer to the authentication provider docs for more information on how to ingest users/groups to the catalog with the appropriate entity provider.',
      );
      logger.info('Sign in using Microsoft Azure login failed as expected');
    });

    test('3. Set dangerouslyAllowSignInWithoutUserInCatalog to false. Login should now work but no User Entities are in the Catalog', async () => {
      // Set upstream.backstage.appConfig.dangerouslyAllowSignInWithoutUserInCatalog = true
      // The Microsoft login should now be successful

      test.setTimeout(300 * 1000);
      logger.info(
        'Execute testcase: Set dangerouslyAllowSignInWithoutUserInCatalog to false. Login should now work but no User Entities are in the Catalog',
      );

      await upgradeHelmChartWithWait(
        constants.AUTH_PROVIDERS_RELEASE,
        constants.AUTH_PROVIDERS_CHART,
        constants.AUTH_PROVIDERS_NAMESPACE,
        constants.AUTH_PROVIDERS_VALUES_FILE,
        [
          '--set upstream.backstage.appConfig.auth.environment=development',
          '--set upstream.backstage.appConfig.signInPage=microsoft',
          '--set upstream.backstage.appConfig.dangerouslyAllowSignInWithoutUserInCatalog=true',
          '--set upstream.backstage.appConfig.catalog.providers=null',
        ],
      );

      logger.info('Sign in using Microsoft Azure login');
      await common.MicrosoftAzureLogin(
        constants.AZURE_LOGIN_USERNAME,
        constants.AZURE_LOGIN_PASSWORD,
      );

      await uiHelper.openSidebar('Settings');
      await uiHelper.verifyParagraph(constants.AZURE_LOGIN_USERNAME);
      logger.info('Sign in using Microsoft Azure login completed as expected');

      // check no entities are in the catalog
      logger.info('Check users in the catalog');
      await page.goto('/catalog?filters[kind]=user&filters[user]=all');
      await uiHelper.verifyHeading('My Org Catalog');
      await uiHelper.searchInputPlaceholder(constants.AZURE_LOGIN_FIRSTNAME);
      await uiHelper.verifyRowsInTable(['No records to display']);
      logger.info('No user found as expected. Signing out.');
      await uiHelper.openSidebar('Settings');
      await common.signOut();
    });
  },
);

test.describe.skip(
  'Standard authentication providers: OIDC with RHSSO 7.6',
  () => {
    let common: Common;
    let uiHelper: UIhelper;

    const kcAdminClient = new KcAdminClient({
      baseUrl: constants.RHSSO76_BASE_URL,
      realmName: constants.AUTH_PROVIDERS_REALM_NAME,
    });

    test.beforeAll(async ({ browser }, testInfo) => {
      logger.info(
        'Staring scenario: Standard authentication providers: OIDC with RHSSO 7.6',
      );
      page = (await setupBrowser(browser, testInfo)).page;
      common = new Common(page);
      uiHelper = new UIhelper(page);
      expect(process.env.BASE_URL).not.toBeNull();
      logger.info(`Base Url is ${process.env.BASE_URL}`);

      try {
        const cred: Credentials = {
          clientSecret: constants.RHSSO76_CLIENT_SECRET,
          grantType: 'client_credentials',
          clientId: constants.RHSSO76_CLIENTID,
          scopes: ['openid', 'profile'],
        };
        await kcAdminClient.auth(cred);
        setInterval(() => kcAdminClient.auth(cred), 58 * 1000);

        const realmSearch = await kcAdminClient.realms.findOne({
          realm: constants.AUTH_PROVIDERS_REALM_NAME,
        });
        expect(realmSearch).not.toBeNull();
        logger.info(`Found realm ${realmSearch}`);

        // Override client configuration for all further requests:
        kcAdminClient.setConfig({
          realmName: constants.AUTH_PROVIDERS_REALM_NAME,
        });

        //cleanup existing users
        const users = await kcAdminClient.users.find();
        for (const user of users) {
          await kcAdminClient.users.del({ id: user.id! });
          logger.info('Deleting existing user: ', user.username);
        }

        //cleanup existing groups
        const groups = await kcAdminClient.groups.find();
        for (const group of groups) {
          await kcAdminClient.groups.del({ id: group.id! });
          logger.info('Deleting existing group: ', group.name);
        }

        for (const key in constants.RHSSO76_GROUPS) {
          const group = constants.RHSSO76_GROUPS[key];
          logger.info('Creating group ' + key);
          await kcAdminClient.groups.create(group);
        }

        for (const key in constants.RHSSO76_USERS) {
          const user = constants.RHSSO76_USERS[key];
          logger.info('Creating user ' + key);
          await kcAdminClient.users.create(user);
        }

        // List users and groups
        const created_users = await kcAdminClient.users.find({
          first: 0,
          max: 20,
        });
        logger.info('Current users: ', created_users.length);
        expect(created_users.length).toBe(
          Object.values(constants.RHSSO76_USERS).length,
        );

        const created_groups = await kcAdminClient.groups.find({
          first: 0,
          max: 20,
        });
        logger.info('Current groups: ', created_groups.length);
        expect(created_groups.length).toBe(
          Object.values(constants.RHSSO76_GROUPS).length,
        );

        const clients = await kcAdminClient.clients.find({
          first: 0,
          max: 20,
          clientId: constants.RHSSO76_CLIENT.clientId,
        });
        logger.info('Current clients: ', clients.length);
        expect(clients.length).toBe(1);

        logger.info(`Users: ${users.map(user => user.username).join(',')}`);
        logger.info(`Users: ${groups.map(group => group.name).join(',')}`);
        logger.info(
          `Users: ${clients.map(client => client.clientId).join(',')}`,
        );
      } catch (e) {
        logger.log({
          level: 'info',
          message: 'RHSSO setup failed:',
          dump: JSON.stringify(e),
        });
        throw new Error('RHSSO setup failed: ' + JSON.stringify(e));
      }
    });

    test.afterAll(async () => {
      test.setTimeout(300 * 1000);
      const podName = await runShellCmd(
        `oc get pods -n ${constants.AUTH_PROVIDERS_NAMESPACE} | awk '{print $1}' | grep '^${constants.AUTH_PROVIDERS_POD_STRING}'`,
      );
      await dumpPodLog(podName.trim(), constants.AUTH_PROVIDERS_NAMESPACE);
      await deleteHelmReleaseWithWait(
        constants.AUTH_PROVIDERS_RELEASE,
        constants.AUTH_PROVIDERS_NAMESPACE,
      );
      logger.info(
        'Ending scenario: Standard authentication providers: OIDC with RHSSO 7.6',
      );
      // close browser page
      page.close();
    });

    test('Default resolver for Keycloak should be emailLocalPartMatchingUserEntityName: user_1 should authenticate, user_2 should not', async () => {
      test.setTimeout(300 * 1000);
      logger.info(
        `Executing testcase: Default resolver for Keycloak should be emailLocalPartMatchingUserEntityName: user_1 should authenticate, user_2 should not`,
      );

      // setup keycloak provider with user ingestion
      await upgradeHelmChartWithWait(
        constants.AUTH_PROVIDERS_RELEASE,
        constants.AUTH_PROVIDERS_CHART,
        constants.AUTH_PROVIDERS_NAMESPACE,
        constants.AUTH_PROVIDERS_VALUES_FILE,
        [
          '--set global.dynamic.plugins[0].disabled=false',
          '--set global.dynamic.plugins[1].disabled=false',
          '--set upstream.postgresql.primary.persistence.enabled=true',
        ],
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

      await common.keycloakLogin(
        constants.RHSSO76_USERS['user_2'].username,
        constants.RHSSO76_DEFAULT_PASSWORD,
      );
      const alert = page.getByRole('alert');
      await alert.waitFor();
      await expect(alert).toHaveText(
        'Login failed; caused by NotFoundError: User not found',
      );

      const usr = await kcAdminClient.users.find({
        q: `username:${constants.RHSSO76_USERS['user_2'].username}`,
      });
      const sessions = await kcAdminClient.users.listSessions({
        id: usr[0].id,
      });
      logger.log({
        level: 'info',
        message: `Clearing ${constants.RHSSO76_USERS['user_2'].username} sessions`,
        dump: JSON.stringify(sessions),
      });

      for (const s of sessions) {
        await kcAdminClient.realms.removeSession({
          realm: constants.AUTH_PROVIDERS_REALM_NAME,
          sessionId: s.id,
        });
      }
    });

    test('Testing resolver emailMatchingUserEntityProfileEmail: user_1 should authenticate, jdoe should not', async () => {
      test.setTimeout(300 * 1000);
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
          '--set global.dynamic.plugins[0].disabled=true',
          '--set global.dynamic.plugins[1].disabled=true',
          '--set upstream.postgresql.primary.persistence.enabled=true',
          '--set upstream.backstage.appConfig.auth.providers.oidc.production.signIn.resolvers[0].resolver=emailMatchingUserEntityProfileEmail',
        ],
      );

      // emailMatchingUserEntityProfileEmail should only allow authentication of keycloak users that match the email attribute with the entity one.
      // update jdoe email -> login should fail with error Login failed; caused by Error: Failed to sign-in, unable to resolve user identity
      let jd: UserRepresentation[];
      try {
        jd = await kcAdminClient.users.find({
          q: `username:${constants.RHSSO76_USERS['jenny_doe'].username}`,
        });
        expect(jd.length).toBe(1);
        const res = await kcAdminClient.users.update(
          { id: jd[0].id },
          { email: constants.JDOE_NEW_EMAIL },
        );
        logger.log({
          level: 'info',
          message: `Updated user: ${constants.RHSSO76_USERS['jenny_doe'].username}: `,
          dump: JSON.stringify(res),
        });
      } catch (e) {
        logger.log({
          level: 'info',
          message: 'Keycloak setup failed:',
          dump: JSON.stringify(e),
        });
        throw new Error('Cannot update user: ' + JSON.stringify(e));
      }

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
      const alert = page.getByRole('alert');
      await alert.waitFor();
      await expect(alert).toHaveText(
        'Login failed; caused by Error: Failed to sign-in, unable to resolve user identity',
      );

      const sessions = await kcAdminClient.users.listSessions({ id: jd[0].id });
      logger.log({
        level: 'info',
        message: `Clearing ${constants.RHSSO76_USERS['jenny_doe'].username} sessions`,
        dump: JSON.stringify(sessions),
      });
      for (const s of sessions) {
        await kcAdminClient.realms.removeSession({
          realm: constants.AUTH_PROVIDERS_REALM_NAME,
          sessionId: s.id,
        });
      }
    });

    test('Testing resolver preferredUsernameMatchingUserEntityName: user_1 and jenny_doe should both authenticate', async () => {
      test.setTimeout(300 * 1000);
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
          '--set global.dynamic.plugins[0].disabled=true',
          '--set global.dynamic.plugins[1].disabled=true',
          '--set upstream.postgresql.primary.persistence.enabled=true',
          '--set upstream.backstage.appConfig.auth.providers.oidc.production.signIn.resolvers[0].resolver=preferredUsernameMatchingUserEntityName',
        ],
      );

      // preferredUsernameMatchingUserEntityName should allow authentication of any keycloak.
      // ingestion is still disabled, so jdoes has still a different email

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
    });
  },
);

test.describe('Standard authentication providers: Micorsoft Azure EntraID', () => {
  test.describe.configure({ retries: 0 });

  let common: Common;
  let context: BrowserContext;
  let uiHelper: UIhelper;
  let syncTime;
  const usersCreated = new Map<string, User>();
  const groupsCreated = new Map<string, Group>();

  test.beforeAll(async ({ browser }, testInfo) => {
    logger.info(
      'Staring scenario: Standard authentication providers: Micorsoft Azure EntraID',
    );

    const browserSetup = await setupBrowser(browser, testInfo);
    page = browserSetup.page;
    context = browserSetup.context;
    common = new Common(page);
    uiHelper = new UIhelper(page);
    expect(process.env.BASE_URL).not.toBeNull();
    logger.info(`Base Url is ${process.env.BASE_URL}`);

    try {
      await graphHelper.initializeGraphForAppOnlyAuth(
        constants.MSGRAPH_SETTINGS,
      );
      logger.info('Setting up users and groups in Microsoft EntraID');

      // explictily remove the renamed user and group to avoid inconsistencies
      const userExists = await graphHelper.getUserByUpnAsync(
        'renamed_' + constants.MSGRAPH_USERS['user_6'].userPrincipalName,
      );
      if (userExists) {
        logger.info(
          `User ${'renamed_' + constants.MSGRAPH_USERS['user_6'].userPrincipalName} already exists. Deleting..`,
        );
        await graphHelper.deleteUserByUpnAsync(
          'renamed_' + constants.MSGRAPH_USERS['user_6'].userPrincipalName,
        );
      }
      const groupExists = await graphHelper.getGroupByNameAsync(
        constants.MSGRAPH_GROUPS['group_6'].displayName + '_renamed',
      );
      if (groupExists && groupExists.value) {
        for (const g of groupExists.value) {
          logger.info(
            `Group with name ${constants.MSGRAPH_GROUPS['group_6'].displayName + '_renamed'} already exists having id ${g.id}. Deleting..`,
          );
          await graphHelper.deleteGroupByIdAsync(g.id);
        }
      }

      // re-create users and groups to avoid inconsistencies

      for (const key in constants.MSGRAPH_USERS) {
        const user = constants.MSGRAPH_USERS[key];
        logger.info(`Creating user ${user.userPrincipalName}`);
        const userExists = await graphHelper.getUserByUpnAsync(
          user.userPrincipalName,
        );
        if (
          userExists &&
          userExists.userPrincipalName == user.userPrincipalName
        ) {
          logger.info(
            `User ${user.userPrincipalName} already exists. Deleting..`,
          );
          await graphHelper.deleteUserByUpnAsync(user.userPrincipalName);
        }
        const newUser = await graphHelper.createUserAsync(user);
        usersCreated[key] = newUser;
        logger.log({
          level: 'info',
          message: `Created user ${user.userPrincipalName}`,
          dump: JSON.stringify(newUser),
        });
      }

      for (const key in constants.MSGRAPH_GROUPS) {
        const group = constants.MSGRAPH_GROUPS[key];
        const groupExists = await graphHelper.getGroupByNameAsync(
          group.displayName,
        );
        if (groupExists && groupExists.value) {
          for (const g of groupExists.value) {
            logger.info(
              `Group with name ${g.displayName} already exists having id ${g.id}. Deleting..`,
            );
            await graphHelper.deleteGroupByIdAsync(g.id);
          }
        }
        const newGroup = await graphHelper.createGrouprAsync(group);
        groupsCreated[key] = newGroup;
        logger.log({
          level: 'info',
          message: `Created group ${group.displayName}`,
          dump: JSON.stringify(newGroup),
        });
      }

      // setup groups memberships
      await graphHelper.addUserToGroupAsync(
        usersCreated['user_1'],
        groupsCreated['group_1'],
      );
      logger.info(
        `Added ${usersCreated['user_1'].userPrincipalName} to group ${groupsCreated['group_1'].displayName}`,
      );

      await graphHelper.addUserToGroupAsync(
        usersCreated['user_2'],
        groupsCreated['group_2'],
      );
      logger.info(
        `Added ${usersCreated['user_2'].userPrincipalName} to group ${groupsCreated['group_2'].displayName}`,
      );

      await graphHelper.addUserToGroupAsync(
        usersCreated['jenny_doe'],
        groupsCreated['group_1'],
      );
      logger.info(
        `Added ${usersCreated['jenny_doe'].userPrincipalName} to group ${groupsCreated['group_1'].displayName}`,
      );

      await graphHelper.addUserToGroupAsync(
        usersCreated['jenny_doe'],
        groupsCreated['group_2'],
      );
      logger.info(
        `Added ${usersCreated['jenny_doe'].userPrincipalName} to group ${groupsCreated['group_2'].displayName}`,
      );

      await graphHelper.addUserToGroupAsync(
        usersCreated['user_3'],
        groupsCreated['group_3'],
      );
      logger.info(
        `Added ${usersCreated['user_3'].userPrincipalName} to group ${groupsCreated['group_3'].displayName}`,
      );

      await graphHelper.addUserToGroupAsync(
        usersCreated['user_4'],
        groupsCreated['group_4'],
      );
      logger.info(
        `Added ${usersCreated['user_4'].userPrincipalName} to group ${groupsCreated['group_4'].displayName}`,
      );

      await graphHelper.addUserToGroupAsync(
        usersCreated['user_5'],
        groupsCreated['group_5'],
      );
      logger.info(
        `Added ${usersCreated['user_5'].userPrincipalName} to group ${groupsCreated['group_5'].displayName}`,
      );

      await graphHelper.addUserToGroupAsync(
        usersCreated['user_6'],
        groupsCreated['group_6'],
      );
      logger.info(
        `Added ${usersCreated['user_6'].userPrincipalName} to group ${groupsCreated['group_6'].displayName}`,
      );

      await graphHelper.addGroupToGroupAsync(
        groupsCreated['group_3'],
        groupsCreated['group_4'],
      );
      logger.info(
        `Nesting group ${groupsCreated['group_3'].displayName} in to group ${groupsCreated['group_4'].displayName}`,
      );

      await graphHelper.addGroupToGroupAsync(
        groupsCreated['group_2'],
        groupsCreated['group_4'],
      );
      logger.info(
        `Nesting group ${groupsCreated['group_2'].displayName} in to group ${groupsCreated['group_4'].displayName}`,
      );
    } catch (e) {
      logger.log({
        level: 'info',
        message: 'Azure EntraID setup failed:',
        dump: JSON.stringify(e),
      });
      throw new Error(
        'Azure EntraID setup failed: ' + JSON.stringify(e, null, 2),
      );
    }
  });

  test.afterAll(async () => {
    /*
    test.setTimeout(300 * 1000);
    const podName = await runShellCmd(`oc get pods -n ${constants.AUTH_PROVIDERS_NAMESPACE} | awk '{print $1}' | grep '^${constants.AUTH_PROVIDERS_POD_STRING}'`)
    await dumpPodLog(podName.trim(), constants.AUTH_PROVIDERS_NAMESPACE)
    await deleteHelmReleaseWithWait(constants.AUTH_PROVIDERS_RELEASE, constants.AUTH_PROVIDERS_NAMESPACE)
    logger.info("Ending scenario: Standard authentication providers: OIDC with RHSSO 7.6")
    // close browser page
    page.close()
    */
  });

  test('Setup Microsoft EntraID with default resolver: user_1 should login and entity is in the catalog', async () => {
    // resolvers from upstream are not available in rhdh
    // testing only default settings

    test.setTimeout(300 * 1000);
    logger.info(
      'Executing testcase: Setup Microsoft EntraID with default resolver: user_1 should login and entity is in the catalog',
    );

    await upgradeHelmChartWithWait(
      constants.AUTH_PROVIDERS_RELEASE,
      constants.AUTH_PROVIDERS_CHART,
      constants.AUTH_PROVIDERS_NAMESPACE,
      constants.AUTH_PROVIDERS_VALUES_FILE,
      [
        '--set upstream.backstage.appConfig.auth.providers.github=null',
        '--set upstream.backstage.appConfig.signInPage=microsoft',
        '--set upstream.backstage.appConfig.auth.environment=production',
        '--set upstream.backstage.appConfig.catalog.providers.githubOrg=null',
        '--set upstream.backstage.appConfig.catalog.providers.keycloakOrg=null',
        '--set global.dynamic.plugins[2].disabled=false',
        '--set upstream.backstage.appConfig.catalog.providers.microsoftGraphOrg.default.schedule.frequency=PT3M',
        '--set upstream.backstage.appConfig.dangerouslyAllowSignInWithoutUserInCatalog=true',
      ],
    );

    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS['user_1'].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    // check no entities are in the catalog
    logger.info('Check users in the catalog');
    await page.goto('/catalog?filters[kind]=user&filters[user]=all');
    await uiHelper.verifyHeading('All users');
    await uiHelper.verifyCellsInTable([
      constants.MSGRAPH_USERS['user_1'].displayName,
    ]);
    logger.info(
      `User ${constants.MSGRAPH_USERS['user_1'].displayName} found in catalog.`,
    );

    await uiHelper.openSidebar('Settings');
    await common.signOut();
  });

  test('Eventually wait to ensure a long-enough time window between two syncs', async () => {
    test.setTimeout(300 * 1000);
    syncTime = await getLastSyncTimeFromLogs('microsoft', 300);
    if (!syncTime) {
      await page.waitForTimeout(1000 * 300);
      syncTime = await getLastSyncTimeFromLogs('microsoft', 300);
    }
    const nextSync = Math.floor(syncTime.nextSyncIn());
    logger.info(
      `Update users and group to ensure sync changes are working as expected`,
    );
    logger.info(
      `Last sync was detected at ${syncTime.lastSync}. Next sync will happen in ${nextSync} seconds.`,
    );
    logger.info(
      `Waiting ${nextSync} seconds to have bigger time window to test changes between syncs.`,
    );
    await page.waitForTimeout(nextSync * 1000);
  });

  test('Ingestion of Users and Nested Groups: verify the UserEntities and Groups are created with the correct relationships in RHDH ', async () => {
    test.setTimeout(60 * 1000);

    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS['user_1'].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    // check entities are in the catalog
    const usersDisplayNames = Object.values(constants.MSGRAPH_USERS).map(
      u => u.displayName,
    );
    logger.info(
      `Check users are in the catalog: ${usersDisplayNames.join(', ')}`,
    );
    await common.CheckUserIsShowingInCatalog(usersDisplayNames);

    // check groups are nested correctly and display all members
    const groupsDisplayNames = Object.values(constants.MSGRAPH_GROUPS).map(
      g => g.displayName,
    );
    logger.info(
      `Check groups are in the catalog: ${groupsDisplayNames.join(', ')}`,
    );
    await common.CheckGroupIsShowingInCatalog(groupsDisplayNames);

    let displayed;

    // group_1 should show jenny_doe and user_1
    displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.MSGRAPH_GROUPS['group_1'].displayName,
    );
    logger.log({
      level: 'info',
      message: `Checking group ${constants.MSGRAPH_GROUPS['group_1'].displayName} is created correctly`,
      dump: displayed,
    });
    expect(displayed.groupMembers).toContain(
      constants.MSGRAPH_USERS['user_1'].displayName,
    );
    expect(displayed.groupMembers).toContain(
      constants.MSGRAPH_USERS['jenny_doe'].displayName,
    );
    expect(displayed.childGroups).toHaveLength(0);

    // group_2 should show jenny_doe and user_2 and parent group: group_4
    displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.MSGRAPH_GROUPS['group_2'].displayName,
    );
    logger.log({
      message: `Checking group ${constants.MSGRAPH_GROUPS['group_2'].displayName} is created correctly`,
      level: `info`,
      dump: displayed,
    });
    expect(displayed.groupMembers).toContain(
      constants.MSGRAPH_USERS['user_2'].displayName,
    );
    expect(displayed.groupMembers).toContain(
      constants.MSGRAPH_USERS['jenny_doe'].displayName,
    );
    expect(displayed.parentGroup).toContain(
      constants.MSGRAPH_GROUPS['group_4'].displayName,
    );

    // group_3 should show user_3 and parent group: group_4
    displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.MSGRAPH_GROUPS['group_3'].displayName,
    );
    logger.log({
      message: `Checking group ${constants.MSGRAPH_GROUPS['group_3'].displayName} is created correctly`,
      level: `info`,
      dump: displayed,
    });
    expect(displayed.groupMembers).toContain(
      constants.MSGRAPH_USERS['user_3'].displayName,
    );
    expect(displayed.parentGroup).toContain(
      constants.MSGRAPH_GROUPS['group_4'].displayName,
    );

    // group_4 should show user_4 and two child groups: group_2 and group_3
    displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.MSGRAPH_GROUPS['group_4'].displayName,
    );
    logger.log({
      message: `Checking group ${constants.MSGRAPH_GROUPS['group_4'].displayName} is created correctly`,
      level: `info`,
      dump: displayed,
    });
    expect(displayed.groupMembers).toContain(
      constants.MSGRAPH_USERS['user_4'].displayName,
    );
    expect(displayed.childGroups).toContain(
      constants.MSGRAPH_GROUPS['group_2'].displayName,
    );
    expect(displayed.childGroups).toContain(
      constants.MSGRAPH_GROUPS['group_3'].displayName,
    );

    await uiHelper.openSidebar('Settings');
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user
  });

  // BEFORE SYNC - Apply some changes to resources

  test('Remove user from Microsoft EntraID: authenticatin should fail before next sync', async () => {
    // remove user from azure -> ensure authentication fails
    logger.info(
      `Executing testcase: Remove user from Microsoft EntraID: authenticatin should fail before next sync. Next sync in ${Math.floor(syncTime.nextSyncIn())} seconds.`,
    );
    await graphHelper.deleteUserByUpnAsync(
      constants.MSGRAPH_USERS['user_1'].userPrincipalName,
    );
    const user = await graphHelper.getUserByUpnAsync(
      constants.MSGRAPH_USERS['user_1'].userPrincipalName,
    );
    expect(user).toBeNull();
    logger.info(
      `User ${constants.MSGRAPH_USERS['user_1'].userPrincipalName} deleted.`,
    );

    await page.waitForTimeout(10000); // Azure needs a couple of seconds to process the user deletion or random errors will be returned

    try {
      await common.MicrosoftAzureLogin(
        constants.MSGRAPH_USERS['user_1'].userPrincipalName,
        constants.RHSSO76_DEFAULT_PASSWORD,
      );
      const alert = page.getByRole('alert');
      await alert.waitFor();
      await expect(alert).toContainText(/Authentication failed/gm);
    } catch (e) {
      if (e == 'User does not exist') {
        logger.info(
          `User ${constants.MSGRAPH_USERS['user_1'].userPrincipalName} login failed as expected.`,
        );
      } else {
        throw e;
      }
    }

    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user
  });

  test('Move a user to another group in Microsoft EntraID: user should still login before next sync', async () => {
    // move a user to another group -> ensure user can still login
    // move user_2 to group_1
    logger.info(
      `Executing testcase: Move a user to another group in Microsoft EntraID: user should still login before next sync. Next sync in ${Math.floor(syncTime.nextSyncIn())} seconds.`,
    );

    await graphHelper.addUserToGroupAsync(
      usersCreated['user_2'],
      groupsCreated['group_1'],
    );
    await graphHelper.removeUserFromGroupAsync(
      usersCreated['user_2'],
      groupsCreated['group_2'],
    );
    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS['user_2'].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await uiHelper.openSidebar('Settings');
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user
  });

  test('Remove a group from Microsoft EntraID: ensure group and its members still exists, member should still login before next sync', async () => {
    // remove a group -> ensure group and its members still exists, member should still login
    // remove group_3
    logger.info(
      `Executing testcase: Remove a group from Microsoft EntraID: ensure group and its members still exists, member should still login before next sync. Next sync in ${Math.floor(syncTime.nextSyncIn())} seconds.`,
    );

    await graphHelper.deleteGroupByIdAsync(groupsCreated['group_3'].id);
    // user_3 should login
    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS['user_3'].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    // group_3 should exist in rhdh
    const displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.MSGRAPH_GROUPS['group_3'].displayName,
    );
    logger.log({
      message: `Checking group ${constants.MSGRAPH_GROUPS['group_3'].displayName} is created correctly`,
      level: `info`,
      dump: displayed,
    });
    expect(displayed.groupMembers).toContain(
      constants.MSGRAPH_USERS['user_3'].displayName,
    );
    expect(displayed.parentGroup).toContain(
      constants.MSGRAPH_GROUPS['group_4'].displayName,
    );

    await uiHelper.openSidebar('Settings');
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user
  });

  test('Remove a user from RHDH: authentication should work, but access is denied before next sync', async () => {
    // remove user from RHDH -> authentication works, access is broken
    logger.info(
      `Executing testcase: Remove a user from RHDH: authentication should work, but access is denied before next sync. Next sync in ${Math.floor(syncTime.nextSyncIn())} seconds.`,
    );

    await common.MicrosoftAzureLogin(
      constants.AZURE_LOGIN_USERNAME,
      constants.AZURE_LOGIN_PASSWORD,
    );
    await common.UnregisterUserEnittyFromCatalog(
      constants.MSGRAPH_USERS['user_4'].displayName,
    );
    await uiHelper.openSidebar('Settings');
    await common.signOut();

    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS['user_4'].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await uiHelper.openSidebar('Settings');
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user

    // TBD: add RBAC test
  });

  test('Remove a group from RHDH: user can login, but policy is broken before next sync', async () => {
    // remove group from RHDH -> user can login, but policy is broken
    logger.info(
      `Executing testcase: Remove a group from RHDH: user can login, but policy is broken before next sync. Next sync in ${Math.floor(syncTime.nextSyncIn())} seconds.`,
    );

    await common.MicrosoftAzureLogin(
      constants.AZURE_LOGIN_USERNAME,
      constants.AZURE_LOGIN_PASSWORD,
    );
    await common.UnregisterGroupEnittyFromCatalog(
      constants.MSGRAPH_GROUPS['group_5'].displayName,
    );
    await uiHelper.openSidebar('Settings');
    await common.signOut();

    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS['user_5'].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await uiHelper.openSidebar('Settings');
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user
  });

  test('Rename a user and a group', async () => {
    // rename group from RHDH -> user can login, but policy is broken
    logger.info(
      `Executing testcase: Rename a user and a group. Next sync in ${Math.floor(syncTime.nextSyncIn())} seconds.`,
    );

    await graphHelper.updateGrouprAsync(groupsCreated['group_6'], {
      displayName: groupsCreated['group_6'].displayName + '_renamed',
    });
    await graphHelper.updateUserAsync(usersCreated['user_6'], {
      displayName: usersCreated['user_6'].displayName + ' Renamed',
      userPrincipalName: 'renamed_' + usersCreated['user_6'].userPrincipalName,
    });
  });

  // AFTER SYNC - Ensure correct behaviour after sync

  test('Wait for next syn to happen', async () => {
    test.setTimeout(300 * 1000);
    const nextSync = Math.floor(syncTime.nextSyncIn());
    logger.info(
      `Last sync was detected at ${syncTime.lastSync}. Next sync will happen in ${nextSync} seconds.`,
    );
    await page.waitForTimeout((nextSync + 5) * 1000);
  });

  test('Remove user from Microsoft EntraID: entity should be removed and groups cleared after the sync', async () => {
    // after the sync
    // check user_1 is deleted from user entities and group entities
    logger.info(
      `execute testcase: Remove user from Microsoft EntraID: entity should be removed and groups cleared after the sync.`,
    );
    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS['jenny_doe'].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    await expect(
      common.CheckUserIsShowingInCatalog([
        constants.MSGRAPH_USERS['user_1'].displayName,
      ]),
    ).rejects.toThrow();

    const displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.MSGRAPH_GROUPS['group_1'].displayName,
    );
    logger.log({
      level: 'info',
      message: `Checking group ${constants.MSGRAPH_GROUPS['group_1'].displayName} does not show user_1 anymore`,
      dump: displayed,
    });
    expect(displayed.groupMembers).not.toContain(
      constants.MSGRAPH_USERS['user_1'].displayName,
    );
    await uiHelper.openSidebar('Settings');
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user
  });

  test('Move a user to another group in Microsoft EntraID: change should be mirrored and permission should be updated after the sync', async () => {
    // ensure the change is mirrored in the catalog
    logger.info(
      `Execute testcase: Move a user to another group in Microsoft EntraID: change should be mirrored and permission should be updated after the sync`,
    );
    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS['jenny_doe'].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );

    const displayed = await common.GoToGroupPageAndGetDisplayedData(
      constants.MSGRAPH_GROUPS['group_1'].displayName,
    );
    logger.log({
      level: 'info',
      message: `Checking group ${constants.MSGRAPH_GROUPS['group_1'].displayName} now shows user_2`,
      dump: displayed,
    });
    expect(displayed.groupMembers).toContain(
      constants.MSGRAPH_USERS['user_2'].displayName,
    );
    await uiHelper.openSidebar('Settings');
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user

    // configure policy permissions different for the two groups
    // after the sync, ensure the permission also reflect the user move
    // TBD: add RBAC test
  });

  test('Remove a group from Microsoft EntraID: group should be removed and permissions should default to read-only after the sync', async () => {
    // after the sync ensure the group entity is removed
    logger.info(
      `Execute testcase: Remove a group from Microsoft EntraID: group should be removed and permissions should default to read-only after the sync.`,
    );
    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS['jenny_doe'].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await expect(
      common.CheckGroupIsShowingInCatalog([
        constants.MSGRAPH_GROUPS['group_3'].displayName,
      ]),
    ).rejects.toThrow();
    await uiHelper.openSidebar('Settings');
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user

    // users permission based on that group will be defaulted to read-only
    // TBD: add RBAC test
  });

  test('Remove a user from RHDH: user is re-created and can login after the sync', async () => {
    // after sync, user_4 is there again and can login
    logger.info(
      `Execute testcase: Remove a user from RHDH: user is re-created and can login after the sync`,
    );
    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS['user_4'].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await common.CheckUserIsShowingInCatalog([
      constants.MSGRAPH_USERS['user_4'].displayName,
    ]);
    await uiHelper.openSidebar('Settings');
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user
  });

  test('Remove a group from RHDH: group is created again after the sync', async () => {
    // after sync, ensure group_5 is created again and memembers can login
    logger.info(
      `Execute testcase: Remove a group from RHDH: group is created again after the sync`,
    );
    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS['user_5'].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await common.CheckGroupIsShowingInCatalog([
      constants.MSGRAPH_GROUPS['group_5'].displayName,
    ]);
    await uiHelper.openSidebar('Settings');
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user
  });

  test('Rename a user and a group: changes are mirrored in RHDH but permissions should be broken after the sync', async () => {
    // after sync, ensure group is mirrored
    // after sync, ensure user change is mirrorred
    logger.info(
      `Execute testcase: Rename a user and a group: changes are mirrored in RHDH but permissions should be broken after the sync`,
    );
    await common.MicrosoftAzureLogin(
      constants.MSGRAPH_USERS['user_5'].userPrincipalName,
      constants.RHSSO76_DEFAULT_PASSWORD,
    );
    await common.CheckUserIsShowingInCatalog([
      constants.MSGRAPH_USERS['user_6'].displayName + ' Renamed',
    ]);
    await common.CheckGroupIsShowingInCatalog([
      constants.MSGRAPH_GROUPS['group_6'].displayName + '_renamed',
    ]);
    await uiHelper.openSidebar('Settings');
    await common.signOut();
    await context.clearCookies(); // If we don't clear cookies, Microsoft Login popup will present the last logger user

    // after rename, permission should be broken
    // update permission with the new group name
    // ensure user can now login
    // TBD: add RBAC test
  });

  test.skip('Rename a user and a group: update the permissions with the new group name, user should login after the sync', async () => {
    // after sync, ensure group is mirrored
    // after rename, permission should be broken
    // update permission with the new group name
    // ensure user can now login
    // after sync, ensure user  change is mirrorred
    // TBD: add RBAC test
  });
});
