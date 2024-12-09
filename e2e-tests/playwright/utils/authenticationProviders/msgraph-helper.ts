import "isomorphic-fetch";
import { ClientSecretCredential } from "@azure/identity";
import { Client, PageCollection } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js";
import { AppSettings } from "./constants";
import { User, Group } from "@microsoft/microsoft-graph-types";
import { LOGGER } from "../logger";
import * as constants from "./constants";
import * as helper from "../helper";

let clientSecretCredential: ClientSecretCredential | undefined = undefined;
let appClient: Client | undefined = undefined;

export function initializeGraphForAppOnlyAuth(settings: AppSettings) {
  LOGGER.info(`Initializing MSGraph client`);

  if (!settings) {
    LOGGER.error(`MSGraph settings undefined`);
    throw new Error("Settings cannot be undefined");
  }

  if (!clientSecretCredential) {
    clientSecretCredential = new ClientSecretCredential(
      settings.tenantId,
      settings.clientId,
      settings.clientSecret,
    );
  }

  if (!appClient) {
    const authProvider = new TokenCredentialAuthenticationProvider(
      clientSecretCredential,
      {
        scopes: ["https://graph.microsoft.com/.default"],
      },
    );

    appClient = Client.initWithMiddleware({
      authProvider: authProvider,
    });
  }
}

export async function getAppOnlyTokenAsync(): Promise<string> {
  // Ensure credential isn't undefined
  if (!clientSecretCredential) {
    LOGGER.error("Graph has not been initialized for app-only auth");
    throw new Error("Graph has not been initialized for app-only auth");
  }

  // Request token with given scopes
  LOGGER.info(`Getting MSGraph token`);
  const response = await clientSecretCredential.getToken([
    "https://graph.microsoft.com/.default",
  ]);
  return response.token;
}

export async function getGroupsAsync(): Promise<PageCollection> {
  // Ensure client isn't undefined
  if (!appClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  }

  LOGGER.info(`Listing groups from Microsoft EntraID`);
  try {
    return appClient
      ?.api("/groups")
      .select(["id", "displayName", "members", "owners"])
      .get();
  } catch (e) {
    LOGGER.error(e);
    throw e;
  }
}

export async function getGroupByNameAsync(
  groupName: string,
): Promise<PageCollection> {
  // Ensure client isn't undefined
  if (!appClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  }
  let group: PageCollection;

  try {
    LOGGER.info(`Getting group ${groupName} from Microsoft EntraID`);
    group = await await appClient
      ?.api("/groups")
      .filter(`displayName eq '${groupName}'`)
      .top(1)
      .get();
  } catch (e) {
    if (e && e.statusCode && e.statusCode == 404) {
      LOGGER.info(`Group ${groupName} not found in Microsoft EntraID`);
      return null;
    } else {
      LOGGER.error(e);
      throw new Error(e);
    }
  }
  return group;
}

export async function getGroupMembersAsync(
  groupId: string,
): Promise<PageCollection> {
  // Ensure client isn't undefined
  if (!appClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  }
  try {
    LOGGER.info(
      `Getting group members of group ${groupId} from Microsoft EntraID`,
    );
    return appClient
      ?.api(`/groups/${groupId}/members`)
      .select([
        "displayName",
        "id",
        "mail",
        "userPrincipalName",
        "surname",
        "firstname",
      ])
      .get();
  } catch (e) {
    LOGGER.error(e);
    throw e;
  }
}

export async function createUserAsync(user: User): Promise<User> {
  // Ensure client isn't undefined
  if (!appClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  }
  try {
    LOGGER.info(`Creating user ${user.userPrincipalName} in Microsoft EntraID`);
    return await appClient?.api("/users").post(user);
  } catch (e) {
    LOGGER.error(e);
    throw e;
  }
}

export async function createGrouprAsync(group: Group): Promise<Group> {
  // Ensure client isn't undefined
  if (!appClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  }
  try {
    LOGGER.info(`Creating group ${group.displayName} in Microsoft EntraID`);
    return await appClient?.api("/groups").post(group);
  } catch (e) {
    LOGGER.error(e);
    throw e;
  }
}

export async function getUsersAsync(): Promise<PageCollection> {
  // Ensure client isn't undefined
  if (!appClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  }
  try {
    LOGGER.info(`Listing users from Microsoft EntraID`);
    return appClient
      ?.api("/users")
      .select([
        "displayName",
        "id",
        "mail",
        "userPrincipalName",
        "surname",
        "firstname",
      ])
      .top(25)
      .orderby("userPrincipalName")
      .get();
  } catch (e) {
    LOGGER.error(e);
    throw e;
  }
}

export async function deleteUserByUpnAsync(upn: string): Promise<User> {
  // Ensure client isn't undefined
  if (!appClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  }
  try {
    LOGGER.info(`Deleting user ${upn} from Microsoft EntraID`);
    return appClient?.api("/users/" + upn).delete();
  } catch (e) {
    LOGGER.error(e);
    throw e;
  }
}

export async function deleteGroupByIdAsync(id: string): Promise<User> {
  // Ensure client isn't undefined
  if (!appClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  }
  try {
    LOGGER.info(`Deleting group ${id} from Microsoft EntraID`);
    return appClient?.api("/groups/" + id).delete();
  } catch (e) {
    LOGGER.error(e);
    throw e;
  }
}

export async function getUserByUpnAsync(upn: string): Promise<User | null> {
  // Ensure client isn't undefined
  if (!appClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  }
  let user: User;

  try {
    LOGGER.info(`Getting user ${upn} from Microsoft EntraID`);
    user = await appClient?.api("/users/" + upn).get();
  } catch (e) {
    if (e && e.statusCode && e.statusCode == 404) {
      LOGGER.info(`User ${upn} not found in Microsoft EntraID`);
      return null;
    } else {
      throw new Error(e);
    }
  }
  return user;
}

export async function addUserToGroupAsync(
  user: User,
  group: Group,
): Promise<Group> {
  // Ensure client isn't undefined
  if (!appClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  }

  const userDirectoryObject = {
    "@odata.id":
      "https://graph.microsoft.com/v1.0/users/" + user.userPrincipalName,
  };
  try {
    LOGGER.info(
      `Adding user ${user.userPrincipalName} to group ${group.displayName} in Microsoft EntraID`,
    );
    return await appClient
      ?.api("/groups/" + group.id + "/members/$ref")
      .post(userDirectoryObject);
  } catch (e) {
    LOGGER.error(e);
    throw e;
  }
}

export async function removeUserFromGroupAsync(
  user: User,
  group: Group,
): Promise<Group> {
  // Ensure client isn't undefined
  if (!appClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  }
  try {
    LOGGER.info(
      `Removing user ${user.userPrincipalName} from group ${group.displayName} in Microsoft EntraID`,
    );
    return await appClient
      ?.api(`/groups/${group.id}/members/${user.id}/$ref`)
      .delete();
  } catch (e) {
    LOGGER.error(e);
    throw e;
  }
}

export async function addGroupToGroupAsync(
  subject: Group,
  target: Group,
): Promise<Group> {
  // Ensure client isn't undefined
  if (!appClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  }

  const userDirectoryObject = {
    "@odata.id": "https://graph.microsoft.com/v1.0/groups/" + subject.id,
  };
  try {
    LOGGER.info(
      `Nesting group ${target.displayName} in group ${subject.displayName} in Microsoft EntraID`,
    );
    return await appClient
      ?.api("/groups/" + target.id + "/members/$ref")
      .post(userDirectoryObject);
  } catch (e) {
    LOGGER.error(e);
    throw e;
  }
}

export async function updateUserAsync(
  user: User,
  updatedUser: User,
): Promise<User> {
  // Ensure client isn't undefined
  if (!appClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  }
  try {
    LOGGER.info(`Updating ${user.userPrincipalName} in Microsoft EntraID`);
    return await appClient
      ?.api("/users/" + user.userPrincipalName)
      .update(updatedUser);
  } catch (e) {
    LOGGER.error(e);
    throw e;
  }
}

export async function updateGrouprAsync(
  group: Group,
  updatedGroup: Group,
): Promise<Group> {
  // Ensure client isn't undefined
  if (!appClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  }
  try {
    LOGGER.info(`Updating group ${group.displayName} in Microsoft EntraID`);
    return await appClient?.api("/groups/" + group.id).update(updatedGroup);
  } catch (e) {
    LOGGER.error(e);
    throw e;
  }
}

export async function setupMicrosoftEntraIDEnvironment(): Promise<{
  usersCreated: Map<string, User>;
  groupsCreated: Map<string, Group>;
}> {
  const usersCreated = new Map<string, User>();
  const groupsCreated = new Map<string, Group>();

  try {
    await initializeGraphForAppOnlyAuth(constants.MSGRAPH_SETTINGS);
    LOGGER.info("Setting up users and groups in Microsoft EntraID");

    // explictily remove the renamed user and group to avoid inconsistencies
    const userExists = await getUserByUpnAsync(
      "renamed_" + constants.MSGRAPH_USERS["user_6"].userPrincipalName,
    );
    if (userExists) {
      LOGGER.info(
        `User ${"renamed_" + constants.MSGRAPH_USERS["user_6"].userPrincipalName} already exists. Deleting..`,
      );
      await deleteUserByUpnAsync(
        "renamed_" + constants.MSGRAPH_USERS["user_6"].userPrincipalName,
      );
    }
    const groupExists = await getGroupByNameAsync(
      constants.MSGRAPH_GROUPS["group_6"].displayName + "_renamed",
    );
    if (groupExists && groupExists.value) {
      for (const g of groupExists.value) {
        LOGGER.info(
          `Group with name ${constants.MSGRAPH_GROUPS["group_6"].displayName + "_renamed"} already exists having id ${g.id}. Deleting..`,
        );
        await deleteGroupByIdAsync(g.id);
      }
    }

    // re-create users and groups to avoid inconsistencies

    for (const key in constants.MSGRAPH_USERS) {
      const user = constants.MSGRAPH_USERS[key];
      const userExists = await getUserByUpnAsync(user.userPrincipalName);
      if (
        userExists &&
        userExists.userPrincipalName == user.userPrincipalName
      ) {
        LOGGER.info(
          `User ${user.userPrincipalName} already exists. Deleting..`,
        );
        await deleteUserByUpnAsync(user.userPrincipalName);
      }
      const newUser = await createUserAsync(user);
      usersCreated[key] = newUser;
    }

    for (const key in constants.MSGRAPH_GROUPS) {
      const group = constants.MSGRAPH_GROUPS[key];
      const groupExists = await getGroupByNameAsync(group.displayName);
      if (groupExists && groupExists.value) {
        for (const g of groupExists.value) {
          LOGGER.info(
            `Group with name ${g.displayName} already exists having id ${g.id}. Deleting..`,
          );
          await deleteGroupByIdAsync(g.id);
        }
      }
      const newGroup = await createGrouprAsync(group);
      groupsCreated[key] = newGroup;
    }

    // setup groups memberships
    await addUserToGroupAsync(usersCreated["user_1"], groupsCreated["group_1"]);
    await addUserToGroupAsync(usersCreated["user_2"], groupsCreated["group_2"]);
    await addUserToGroupAsync(
      usersCreated["jenny_doe"],
      groupsCreated["group_1"],
    );
    await addUserToGroupAsync(
      usersCreated["jenny_doe"],
      groupsCreated["group_2"],
    );
    await addUserToGroupAsync(usersCreated["user_3"], groupsCreated["group_3"]);
    await addUserToGroupAsync(usersCreated["user_4"], groupsCreated["group_4"]);
    await addUserToGroupAsync(usersCreated["user_5"], groupsCreated["group_5"]);
    await addUserToGroupAsync(usersCreated["user_6"], groupsCreated["group_6"]);
    await addGroupToGroupAsync(
      groupsCreated["group_3"],
      groupsCreated["group_4"],
    );
    // create rbac policy for created users
    await helper.ensureNewPolicyConfigMapExists(
      "rbac-policy",
      constants.AUTH_PROVIDERS_NAMESPACE,
    );
  } catch (e) {
    LOGGER.error({
      level: "info",
      message: "Azure EntraID setup failed:",
      dump: JSON.stringify(e),
    });
    throw new Error(
      "Azure EntraID setup failed: " + JSON.stringify(e, null, 2),
    );
  }
  return {
    usersCreated,
    groupsCreated,
  };
}

export function formatUPNToEntity(user: string) {
  return user.replace("@", "_");
}
