import { LOGGER } from "../logger";
import { expect } from "@playwright/test";
import * as constants from "./constants";
import GroupRepresentation from "@keycloak/keycloak-admin-client/lib/defs/groupRepresentation";
import UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation";
import KcAdminClient from "@keycloak/keycloak-admin-client";
import { ConnectionConfig } from "@keycloak/keycloak-admin-client/lib/client";
import { Credentials } from "@keycloak/keycloak-admin-client/lib/utils/auth";
import * as helper from "../helper";

export class RHSSOHelper {
  kcAdminClient: KcAdminClient | undefined;
  connectionConfig: ConnectionConfig;
  cred: Credentials;
  version: string;

  constructor(version: string) {
    this.version = version;
    if (version == "RHSSO") {
      this.connectionConfig = {
        baseUrl: constants.RHSSO76_URL,
        realmName: constants.AUTH_PROVIDERS_REALM_NAME,
      };
      this.cred = {
        clientSecret: constants.RHSSO76_CLIENT_SECRET,
        grantType: "client_credentials",
        clientId: constants.RHSSO76_CLIENTID,
        scopes: ["openid", "profile"],
      };
    } else if (version == "RHBK") {
      this.connectionConfig = {
        baseUrl: constants.RHBK_URL,
        realmName: constants.AUTH_PROVIDERS_REALM_NAME,
      };
      this.cred = {
        clientSecret: constants.RHBK_CLIENT_SECRET,
        grantType: "client_credentials",
        clientId: constants.RHBK_CLIENTID,
        scopes: ["openid", "profile"],
      };
    }
  }

  async initializeRHSSOClient() {
    // Ensure settings isn't null
    if (!this.connectionConfig) {
      LOGGER.error(`${this.version} config cannot be undefined`);
      throw new Error("Config cannot be undefined");
    }
    LOGGER.info(`Initializing ${this.version} client`);
    this.kcAdminClient = new KcAdminClient(this.connectionConfig);
    await this.kcAdminClient.auth(this.cred);
    setInterval(() => this.kcAdminClient.auth(this.cred), 58 * 1000);
  }

  async setupRHSSOEnvironment(): Promise<{
    usersCreated: Map<string, UserRepresentation>;
    groupsCreated: Map<string, GroupRepresentation>;
  }> {
    LOGGER.info(`Setting up ${this.version} environment`);
    const usersCreated = new Map<string, UserRepresentation>();
    const groupsCreated = new Map<string, GroupRepresentation>();

    try {
      const realmSearch = await this.kcAdminClient.realms.findOne({
        realm: constants.AUTH_PROVIDERS_REALM_NAME,
      });
      expect(realmSearch).not.toBeNull();

      // Override client configuration for all further requests:
      this.kcAdminClient.setConfig({
        realmName: constants.AUTH_PROVIDERS_REALM_NAME,
      });

      //cleanup existing users
      const users = await this.kcAdminClient.users.find();
      for (const user of users) {
        await this.kcAdminClient.users.del({ id: user.id! });
      }

      //cleanup existing groups
      const groups = await this.kcAdminClient.groups.find();
      for (const group of groups) {
        await this.kcAdminClient.groups.del({ id: group.id! });
      }

      for (const key in constants.RHSSO76_GROUPS) {
        const group = constants.RHSSO76_GROUPS[key];
        const newGroup = await this.kcAdminClient.groups.create(group);
        groupsCreated[key] = newGroup;
      }

      for (const key in constants.RHSSO76_USERS) {
        const user = constants.RHSSO76_USERS[key];
        const newUser = await this.kcAdminClient.users.create(user);
        usersCreated[key] = newUser;
      }

      const nestedgroup = await this.kcAdminClient.groups.createChildGroup(
        { id: groupsCreated["group_2"].id },
        constants.RHSSO76_NESTED_GROUP,
      );
      LOGGER.info(JSON.stringify(nestedgroup));

      await this.kcAdminClient.users.addToGroup({
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
        message: `${this.version} setup failed:`,
        dump: JSON.stringify(e),
      });
      throw new Error(`${this.version} setup failed: ${JSON.stringify(e)}`);
    }
    return {
      usersCreated,
      groupsCreated,
    };
  }

  async clearUserSessions(username: string, realm: string) {
    const usr = await this.kcAdminClient.users.find({
      q: `username:${username}`,
    });
    const sessions = await this.kcAdminClient.users.listSessions({
      id: usr[0].id,
    });
    LOGGER.log({
      level: "info",
      message: `Clearing ${username} sessions`,
      dump: JSON.stringify(sessions.map((s) => s.id)),
    });

    for (const s of sessions) {
      await this.kcAdminClient.realms.removeSession({
        realm: realm,
        sessionId: s.id,
      });
    }
  }

  async updateUser(userId: string, userObj: UserRepresentation) {
    try {
      LOGGER.info(`Update user ${userId} from ${this.version}`);
      await this.kcAdminClient.users.update({ id: userId }, userObj);
    } catch (e) {
      LOGGER.error(e);
      throw e;
    }
  }

  async updateGruop(groupId: string, groupObj: GroupRepresentation) {
    try {
      LOGGER.info(`Update group ${groupId} from ${this.version}`);
      await this.kcAdminClient.groups.update({ id: groupId }, groupObj);
    } catch (e) {
      LOGGER.error(e);
      throw e;
    }
  }

  async updateUserEmail(username: string, newEmail: string) {
    let jd: UserRepresentation[];
    try {
      jd = await this.kcAdminClient.users.find({
        q: `username:${username}`,
      });
      expect(jd.length).toBe(1);
      const res = await this.kcAdminClient.users.update(
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
        message: `${this.version} update email failed:`,
        dump: JSON.stringify(e),
      });
      throw new Error("Cannot update user: " + JSON.stringify(e));
    }
  }

  async deleteUser(id: string) {
    try {
      LOGGER.info(`Deleting user ${id} from ${this.version}`);
      await this.kcAdminClient.users.del({ id: id });
    } catch (e) {
      LOGGER.error(e);
      throw e;
    }
  }

  async removeUserFromGroup(userId: string, groupId: string) {
    try {
      LOGGER.info(
        `Remove user ${userId} from  group ${groupId} from ${this.version}`,
      );
      await this.kcAdminClient.users.delFromGroup({
        id: userId,
        groupId: groupId,
      });
    } catch (e) {
      LOGGER.error(e);
      throw e;
    }
  }

  async addUserToGroup(userId: string, groupId: string) {
    try {
      LOGGER.info(
        `Add user ${userId} from  group ${groupId} from ${this.version}`,
      );
      await this.kcAdminClient.users.addToGroup({
        id: userId,
        groupId: groupId,
      });
    } catch (e) {
      LOGGER.error(e);
      throw e;
    }
  }

  async deleteGroup(groupId: string) {
    try {
      LOGGER.info(`Deleting group ${groupId} from ${this.version}`);
      await this.kcAdminClient.groups.del({ id: groupId });
    } catch (e) {
      LOGGER.error(e);
      throw e;
    }
  }

  getRHSSOUserDisplayName(user: UserRepresentation) {
    return user.firstName + " " + user.lastName;
  }
}
