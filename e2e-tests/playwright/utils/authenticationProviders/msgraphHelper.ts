import 'isomorphic-fetch';
import { ClientSecretCredential } from '@azure/identity';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js';
import { AppSettings } from './constants';
import { User, Group } from '@microsoft/microsoft-graph-types';
import { logger } from './Logger';
import * as constants from './constants';
import * as helper from '../../utils/authenticationProviders/helper';

let _settings: AppSettings | undefined = undefined;
let _clientSecretCredential: ClientSecretCredential | undefined = undefined;
let _appClient: Client | undefined = undefined;

export function initializeGraphForAppOnlyAuth(settings: AppSettings) {
  // Ensure settings isn't null
  if (!settings) {
    throw new Error('Settings cannot be undefined');
  }

  _settings = settings;

  if (!_clientSecretCredential) {
    _clientSecretCredential = new ClientSecretCredential(
      _settings.tenantId,
      _settings.clientId,
      _settings.clientSecret,
    );
  }

  if (!_appClient) {
    const authProvider = new TokenCredentialAuthenticationProvider(
      _clientSecretCredential,
      {
        scopes: ['https://graph.microsoft.com/.default'],
      },
    );

    _appClient = Client.initWithMiddleware({
      authProvider: authProvider,
    });
  }
}

export async function getAppOnlyTokenAsync(): Promise<string> {
  // Ensure credential isn't undefined
  if (!_clientSecretCredential) {
    throw new Error('Graph has not been initialized for app-only auth');
  }

  // Request token with given scopes
  const response = await _clientSecretCredential.getToken([
    'https://graph.microsoft.com/.default',
  ]);
  return response.token;
}

export async function getGroupsAsync(): Promise<PageCollection> {
  // Ensure client isn't undefined
  if (!_appClient) {
    throw new Error('Graph has not been initialized for app-only auth');
  }

  return _appClient
    ?.api('/groups')
    .select(['id', 'displayName', 'members', 'owners'])
    .get();
}

export async function getGroupByNameAsync(
  groupName: string,
): Promise<PageCollection> {
  // Ensure client isn't undefined
  if (!_appClient) {
    throw new Error('Graph has not been initialized for app-only auth');
  }
  let group: PageCollection;

  try {
    group = await await _appClient
      ?.api('/groups')
      .filter(`displayName eq '${groupName}'`)
      .top(1)
      .get();
  } catch (e) {
    if (e && e.statusCode && e.statusCode == 404) {
      return null;
    } else {
      throw new Error(e);
    }
  }
  return group;
}

export async function getGroupMembersAsync(
  groupId: string,
): Promise<PageCollection> {
  // Ensure client isn't undefined
  if (!_appClient) {
    throw new Error('Graph has not been initialized for app-only auth');
  }

  return _appClient
    ?.api(`/groups/${groupId}/members`)
    .select([
      'displayName',
      'id',
      'mail',
      'userPrincipalName',
      'surname',
      'firstname',
    ])
    .get();
}

export async function createUserAsync(user: User): Promise<User> {
  // Ensure client isn't undefined
  if (!_appClient) {
    throw new Error('Graph has not been initialized for app-only auth');
  }

  return await _appClient?.api('/users').post(user);
}

export async function createGrouprAsync(group: Group): Promise<Group> {
  // Ensure client isn't undefined
  if (!_appClient) {
    throw new Error('Graph has not been initialized for app-only auth');
  }

  return await _appClient?.api('/groups').post(group);
}

export async function getUsersAsync(): Promise<PageCollection> {
  // Ensure client isn't undefined
  if (!_appClient) {
    throw new Error('Graph has not been initialized for app-only auth');
  }

  return _appClient
    ?.api('/users')
    .select([
      'displayName',
      'id',
      'mail',
      'userPrincipalName',
      'surname',
      'firstname',
    ])
    .top(25)
    .orderby('userPrincipalName')
    .get();
}

export async function deleteUserByUpnAsync(upn: string): Promise<User> {
  // Ensure client isn't undefined
  if (!_appClient) {
    throw new Error('Graph has not been initialized for app-only auth');
  }

  return _appClient?.api('/users/' + upn).delete();
}

export async function deleteGroupByIdAsync(id: string): Promise<User> {
  // Ensure client isn't undefined
  if (!_appClient) {
    throw new Error('Graph has not been initialized for app-only auth');
  }

  return _appClient?.api('/groups/' + id).delete();
}

export async function getUserByUpnAsync(upn: string): Promise<User | null> {
  // Ensure client isn't undefined
  if (!_appClient) {
    throw new Error('Graph has not been initialized for app-only auth');
  }
  let user: User;

  try {
    user = await _appClient?.api('/users/' + upn).get();
  } catch (e) {
    if (e && e.statusCode && e.statusCode == 404) {
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
  if (!_appClient) {
    throw new Error('Graph has not been initialized for app-only auth');
  }

  const userDirectoryObject = {
    '@odata.id':
      'https://graph.microsoft.com/v1.0/users/' + user.userPrincipalName,
  };

  return await _appClient
    ?.api('/groups/' + group.id + '/members/$ref')
    .post(userDirectoryObject);
}

export async function removeUserFromGroupAsync(
  user: User,
  group: Group,
): Promise<Group> {
  // Ensure client isn't undefined
  if (!_appClient) {
    throw new Error('Graph has not been initialized for app-only auth');
  }

  return await _appClient
    ?.api(`/groups/${group.id}/members/${user.id}/$ref`)
    .delete();
}

export async function addGroupToGroupAsync(
  subject: Group,
  target: Group,
): Promise<Group> {
  // Ensure client isn't undefined
  if (!_appClient) {
    throw new Error('Graph has not been initialized for app-only auth');
  }

  const userDirectoryObject = {
    '@odata.id': 'https://graph.microsoft.com/v1.0/groups/' + subject.id,
  };

  return await _appClient
    ?.api('/groups/' + target.id + '/members/$ref')
    .post(userDirectoryObject);
}

export async function updateUserAsync(
  user: User,
  updatedUser: User,
): Promise<User> {
  // Ensure client isn't undefined
  if (!_appClient) {
    throw new Error('Graph has not been initialized for app-only auth');
  }

  return await _appClient
    ?.api('/users/' + user.userPrincipalName)
    .update(updatedUser);
}

export async function updateGrouprAsync(
  group: Group,
  updatedGroup: Group,
): Promise<Group> {
  // Ensure client isn't undefined
  if (!_appClient) {
    throw new Error('Graph has not been initialized for app-only auth');
  }

  return await _appClient?.api('/groups/' + group.id).update(updatedGroup);
}

export async function setupMicrosoftEntraIDEnvironment(): Promise<{
  usersCreated: Map<string, User>;
  groupsCreated: Map<string, Group>;
}> {
  const usersCreated = new Map<string, User>();
  const groupsCreated = new Map<string, Group>();

  try {
    await initializeGraphForAppOnlyAuth(constants.MSGRAPH_SETTINGS);
    logger.info('Setting up users and groups in Microsoft EntraID');

    // explictily remove the renamed user and group to avoid inconsistencies
    const userExists = await getUserByUpnAsync(
      'renamed_' + constants.MSGRAPH_USERS['user_6'].userPrincipalName,
    );
    if (userExists) {
      logger.info(
        `User ${'renamed_' + constants.MSGRAPH_USERS['user_6'].userPrincipalName} already exists. Deleting..`,
      );
      await deleteUserByUpnAsync(
        'renamed_' + constants.MSGRAPH_USERS['user_6'].userPrincipalName,
      );
    }
    const groupExists = await getGroupByNameAsync(
      constants.MSGRAPH_GROUPS['group_6'].displayName + '_renamed',
    );
    if (groupExists && groupExists.value) {
      for (const g of groupExists.value) {
        logger.info(
          `Group with name ${constants.MSGRAPH_GROUPS['group_6'].displayName + '_renamed'} already exists having id ${g.id}. Deleting..`,
        );
        await deleteGroupByIdAsync(g.id);
      }
    }

    // re-create users and groups to avoid inconsistencies

    for (const key in constants.MSGRAPH_USERS) {
      const user = constants.MSGRAPH_USERS[key];
      logger.info(`Creating user ${user.userPrincipalName}`);
      const userExists = await getUserByUpnAsync(user.userPrincipalName);
      if (
        userExists &&
        userExists.userPrincipalName == user.userPrincipalName
      ) {
        logger.info(
          `User ${user.userPrincipalName} already exists. Deleting..`,
        );
        await deleteUserByUpnAsync(user.userPrincipalName);
      }
      const newUser = await createUserAsync(user);
      usersCreated[key] = newUser;
      logger.log({
        level: 'info',
        message: `Created user ${user.userPrincipalName}`,
        dump: JSON.stringify(newUser),
      });
    }

    for (const key in constants.MSGRAPH_GROUPS) {
      const group = constants.MSGRAPH_GROUPS[key];
      const groupExists = await getGroupByNameAsync(group.displayName);
      if (groupExists && groupExists.value) {
        for (const g of groupExists.value) {
          logger.info(
            `Group with name ${g.displayName} already exists having id ${g.id}. Deleting..`,
          );
          await deleteGroupByIdAsync(g.id);
        }
      }
      const newGroup = await createGrouprAsync(group);
      groupsCreated[key] = newGroup;
      logger.log({
        level: 'info',
        message: `Created group ${group.displayName}`,
        dump: JSON.stringify(newGroup),
      });
    }

    // setup groups memberships
    await addUserToGroupAsync(usersCreated['user_1'], groupsCreated['group_1']);
    logger.info(
      `Added ${usersCreated['user_1'].userPrincipalName} to group ${groupsCreated['group_1'].displayName}`,
    );

    await addUserToGroupAsync(usersCreated['user_2'], groupsCreated['group_2']);
    logger.info(
      `Added ${usersCreated['user_2'].userPrincipalName} to group ${groupsCreated['group_2'].displayName}`,
    );

    await addUserToGroupAsync(
      usersCreated['jenny_doe'],
      groupsCreated['group_1'],
    );
    logger.info(
      `Added ${usersCreated['jenny_doe'].userPrincipalName} to group ${groupsCreated['group_1'].displayName}`,
    );

    await addUserToGroupAsync(
      usersCreated['jenny_doe'],
      groupsCreated['group_2'],
    );
    logger.info(
      `Added ${usersCreated['jenny_doe'].userPrincipalName} to group ${groupsCreated['group_2'].displayName}`,
    );

    await addUserToGroupAsync(usersCreated['user_3'], groupsCreated['group_3']);
    logger.info(
      `Added ${usersCreated['user_3'].userPrincipalName} to group ${groupsCreated['group_3'].displayName}`,
    );

    await addUserToGroupAsync(usersCreated['user_4'], groupsCreated['group_4']);
    logger.info(
      `Added ${usersCreated['user_4'].userPrincipalName} to group ${groupsCreated['group_4'].displayName}`,
    );

    await addUserToGroupAsync(usersCreated['user_5'], groupsCreated['group_5']);
    logger.info(
      `Added ${usersCreated['user_5'].userPrincipalName} to group ${groupsCreated['group_5'].displayName}`,
    );

    await addUserToGroupAsync(usersCreated['user_6'], groupsCreated['group_6']);
    logger.info(
      `Added ${usersCreated['user_6'].userPrincipalName} to group ${groupsCreated['group_6'].displayName}`,
    );

    await addGroupToGroupAsync(
      groupsCreated['group_3'],
      groupsCreated['group_4'],
    );
    logger.info(
      `Nesting group ${groupsCreated['group_3'].displayName} in to group ${groupsCreated['group_4'].displayName}`,
    );

    // create rbac policy for created users
    await helper.ensureNewPolicyConfigMapExists(
      'rbac-policy',
      constants.AUTH_PROVIDERS_NAMESPACE,
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
  return {
    usersCreated,
    groupsCreated,
  };
}
