import { LOGGER } from "../logger";
import { expect } from "@playwright/test";
import * as constants from "./constants";
import GroupRepresentation from "@keycloak/keycloak-admin-client/lib/defs/groupRepresentation";
import UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation";
import KcAdminClient from "@keycloak/keycloak-admin-client";
import { ConnectionConfig } from "@keycloak/keycloak-admin-client/lib/client";
import { Credentials } from "@keycloak/keycloak-admin-client/lib/utils/auth";
import * as helper from "../helper";

let kcAdminClient: KcAdminClient | undefined;

export const CONNECTION_CONFIG: ConnectionConfig = {
  baseUrl: constants.RHSSO76_URL,
  realmName: constants.AUTH_PROVIDERS_REALM_NAME,
};

const cred: Credentials = {
  clientSecret: constants.RHSSO76_CLIENT_SECRET,
  grantType: "client_credentials",
  clientId: constants.RHSSO76_CLIENTID,
  scopes: ["openid", "profile"],
};

export async function initializeRHSSOClient(
  connectionConfig: ConnectionConfig,
) {
  // Ensure settings isn't null
  if (!connectionConfig) {
    LOGGER.error(`RHSSO config cannot be undefined`);
    throw new Error("Config cannot be undefined");
  }
  LOGGER.info(`Initializing RHSSO client`);
  kcAdminClient = new KcAdminClient(connectionConfig);
  await kcAdminClient.auth(cred);
  setInterval(() => kcAdminClient.auth(cred), 58 * 1000);
}

export async function setupRHSSOEnvironment(): Promise<{
  usersCreated: Map<string, UserRepresentation>;
  groupsCreated: Map<string, GroupRepresentation>;
}> {
  LOGGER.info("Setting up RHSSO environment");
  const usersCreated = new Map<string, UserRepresentation>();
  const groupsCreated = new Map<string, GroupRepresentation>();

  try {
    const realmSearch = await kcAdminClient.realms.findOne({
      realm: constants.AUTH_PROVIDERS_REALM_NAME,
    });
    expect(realmSearch).not.toBeNull();

    // Override client configuration for all further requests:
    kcAdminClient.setConfig({
      realmName: constants.AUTH_PROVIDERS_REALM_NAME,
    });

    //cleanup existing users
    const users = await kcAdminClient.users.find();
    for (const user of users) {
      await kcAdminClient.users.del({ id: user.id! });
    }

    //cleanup existing groups
    const groups = await kcAdminClient.groups.find();
    for (const group of groups) {
      await kcAdminClient.groups.del({ id: group.id! });
    }

    for (const key in constants.RHSSO76_GROUPS) {
      const group = constants.RHSSO76_GROUPS[key];
      const newGroup = await kcAdminClient.groups.create(group);
      groupsCreated[key] = newGroup;
    }

    for (const key in constants.RHSSO76_USERS) {
      const user = constants.RHSSO76_USERS[key];
      const newUser = await kcAdminClient.users.create(user);
      usersCreated[key] = newUser;
    }

    const nestedgroup = await kcAdminClient.groups.createChildGroup(
      { id: groupsCreated["group_2"].id },
      constants.RHSSO76_NESTED_GROUP,
    );

    await kcAdminClient.users.addToGroup({
      id: usersCreated["user_3"].id,
      groupId: nestedgroup.id,
    });

    // create rbac policy for created users
    await helper.ensureNewPolicyConfigMapExists(
      "rbac-policy",
      constants.AUTH_PROVIDERS_NAMESPACE,
    );
  } catch (e) {
    LOGGER.log({
      level: "error",
      message: "RHSSO setup failed:",
      dump: JSON.stringify(e),
    });
    throw new Error("RHSSO setup failed: " + JSON.stringify(e));
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
  LOGGER.log({
    level: "info",
    message: `Clearing ${username} sessions`,
    dump: JSON.stringify(sessions.map((s) => s.id)),
  });

  for (const s of sessions) {
    await kcAdminClient.realms.removeSession({
      realm: realm,
      sessionId: s.id,
    });
  }
}

export async function updateUser(userId: string, userObj: UserRepresentation) {
  try {
    LOGGER.info(`Update user ${userId} from RHSSO`);
    await kcAdminClient.users.update({ id: userId }, userObj);
  } catch (e) {
    LOGGER.error(e);
    throw e;
  }
}

export async function updateGruop(
  groupId: string,
  groupObj: GroupRepresentation,
) {
  try {
    LOGGER.info(`Update group ${groupId} from RHSSO`);
    await kcAdminClient.groups.update({ id: groupId }, groupObj);
  } catch (e) {
    LOGGER.error(e);
    throw e;
  }
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
    LOGGER.log({
      level: "info",
      message: `Updated user: ${username}: `,
      dump: JSON.stringify(res),
    });
  } catch (e) {
    LOGGER.log({
      level: "info",
      message: "RHSSO update email failed:",
      dump: JSON.stringify(e),
    });
    throw new Error("Cannot update user: " + JSON.stringify(e));
  }
}

export async function deleteUser(id: string) {
  try {
    LOGGER.info(`Deleting user ${id} from RHSSO`);
    await kcAdminClient.users.del({ id: id });
  } catch (e) {
    LOGGER.error(e);
    throw e;
  }
}

export async function removeUserFromGroup(userId: string, groupId: string) {
  try {
    LOGGER.info(`Remove user ${userId} from  group ${groupId} from RHSSO`);
    await kcAdminClient.users.delFromGroup({ id: userId, groupId: groupId });
  } catch (e) {
    LOGGER.error(e);
    throw e;
  }
}

export async function addUserToGroup(userId: string, groupId: string) {
  try {
    LOGGER.info(`Add user ${userId} from  group ${groupId} from RHSSO`);
    await kcAdminClient.users.addToGroup({ id: userId, groupId: groupId });
  } catch (e) {
    LOGGER.error(e);
    throw e;
  }
}

export async function deleteGroup(groupId: string) {
  try {
    LOGGER.info(`Deleting group ${groupId} from RHSSO`);
    await kcAdminClient.groups.del({ id: groupId });
  } catch (e) {
    LOGGER.error(e);
    throw e;
  }
}

export function getRHSSOUserDisplayName(user: UserRepresentation) {
  return user.firstName + " " + user.lastName;
}
