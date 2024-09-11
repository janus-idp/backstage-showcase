import { logger } from './Logger';
import { expect } from '@playwright/test';
import * as constants from './constants';
import GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { ConnectionConfig } from '@keycloak/keycloak-admin-client/lib/client';
import { Credentials } from '@keycloak/keycloak-admin-client/lib/utils/auth';
import * as helper from '../../utils/authenticationProviders/helper';

let kcAdminClient: KcAdminClient | undefined;

export const connectionConfig: ConnectionConfig = {
  baseUrl: constants.RHSSO76_URL,
  realmName: constants.AUTH_PROVIDERS_REALM_NAME,
};

const cred: Credentials = {
  clientSecret: constants.RHSSO76_CLIENT_SECRET,
  grantType: 'client_credentials',
  clientId: constants.RHSSO76_CLIENTID,
  scopes: ['openid', 'profile'],
};

export async function initializeRHSSOClient(
  connectionConfig: ConnectionConfig,
) {
  // Ensure settings isn't null
  if (!connectionConfig) {
    throw new Error('Config cannot be undefined');
  }
  kcAdminClient = new KcAdminClient(connectionConfig);
  await kcAdminClient.auth(cred);
  setInterval(() => kcAdminClient.auth(cred), 58 * 1000);
}

export async function setupRHSSOEnvironment(): Promise<{
  usersCreated: Map<string, UserRepresentation>;
  groupsCreated: Map<string, GroupRepresentation>;
}> {
  const usersCreated = new Map<string, UserRepresentation>();
  const groupsCreated = new Map<string, GroupRepresentation>();

  try {
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
      const newGroup = await kcAdminClient.groups.create(group);
      groupsCreated[key] = newGroup;
    }

    for (const key in constants.RHSSO76_USERS) {
      const user = constants.RHSSO76_USERS[key];
      logger.info('Creating user ' + key);
      const newUser = await kcAdminClient.users.create(user);
      usersCreated[key] = newUser;
    }

    const nestedgroup = await kcAdminClient.groups.createChildGroup(
      { id: groupsCreated['group_2'].id },
      constants.RHSSO76_NESTED_GROUP,
    );

    await kcAdminClient.users.addToGroup({
      id: usersCreated['user_3'].id,
      groupId: nestedgroup.id,
    });

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
    logger.info(`Users: ${clients.map(client => client.clientId).join(',')}`);

    // create rbac policy for created users
    await helper.ensureNewPolicyConfigMapExists(
      'rbac-policy',
      constants.AUTH_PROVIDERS_NAMESPACE,
    );
  } catch (e) {
    logger.log({
      level: 'info',
      message: 'RHSSO setup failed:',
      dump: JSON.stringify(e),
    });
    throw new Error('RHSSO setup failed: ' + JSON.stringify(e));
  }
  return {
    usersCreated,
    groupsCreated,
  };
}

export async function clearUserSessions(username: string, realm: string) {
  const usr = await kcAdminClient.users.find({
    q: `username:${username}`,
  });
  const sessions = await kcAdminClient.users.listSessions({
    id: usr[0].id,
  });
  logger.log({
    level: 'info',
    message: `Clearing ${username} sessions`,
    dump: JSON.stringify(sessions),
  });

  for (const s of sessions) {
    await kcAdminClient.realms.removeSession({
      realm: realm,
      sessionId: s.id,
    });
  }
}

export async function updateUser(userId: string, userObj: UserRepresentation) {
  await kcAdminClient.users.update({ id: userId }, userObj);
}

export async function updateGruop(
  groupId: string,
  groupObj: GroupRepresentation,
) {
  await kcAdminClient.groups.update({ id: groupId }, groupObj);
}

export async function updateUserEmail(username: string, newEmail: string) {
  let jd: UserRepresentation[];
  try {
    jd = await kcAdminClient.users.find({
      q: `username:${username}`,
    });
    expect(jd.length).toBe(1);
    const res = await kcAdminClient.users.update(
      { id: jd[0].id },
      { email: newEmail },
    );
    logger.log({
      level: 'info',
      message: `Updated user: ${username}: `,
      dump: JSON.stringify(res),
    });
  } catch (e) {
    logger.log({
      level: 'info',
      message: 'Keycloak update email failed:',
      dump: JSON.stringify(e),
    });
    throw new Error('Cannot update user: ' + JSON.stringify(e));
  }
}

export async function deleteUser(id: string) {
  await kcAdminClient.users.del({ id: id });
}

export async function removeUserFromGroup(userId: string, groupId: string) {
  await kcAdminClient.users.delFromGroup({ id: userId, groupId: groupId });
}

export async function addUserToGroup(userId: string, groupId: string) {
  await kcAdminClient.users.addToGroup({ id: userId, groupId: groupId });
}

export async function deleteGroup(groupId: string) {
  await kcAdminClient.groups.del({ id: groupId });
}
