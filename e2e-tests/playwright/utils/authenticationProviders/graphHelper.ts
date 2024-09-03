import 'isomorphic-fetch';
import { ClientSecretCredential } from '@azure/identity';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js';
import { AppSettings } from './constants';
import { User, Group } from '@microsoft/microsoft-graph-types';

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
