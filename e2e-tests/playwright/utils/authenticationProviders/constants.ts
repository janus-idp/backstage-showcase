/* eslint-disable no-useless-escape */
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation';
import ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation';
import { User, Group } from '@microsoft/microsoft-graph-types';

export const RHSSO76_ADMIN_USERNAME = process.env.RHSSO76_ADMIN_USERNAME;
export const RHSSO76_ADMIN_PASSWORD = process.env.RHSSO76_ADMIN_PASSWORD;
export const RHSSO76_DEFAULT_PASSWORD = process.env.RHSSO76_DEFAULT_PASSWORD;
export const RHSSO76_BASE_URL = process.env.RHSSO76_BASE_URL;
export const RHSSO76_CLIENT_SECRET = process.env.RHSSO76_CLIENT_SECRET;
export const AZURE_LOGIN_USERNAME = process.env.AZURE_LOGIN_USERNAME;
export const AZURE_LOGIN_PASSWORD = process.env.AZURE_LOGIN_PASSWORD;
export const AUTH_PROVIDERS_AZURE_CLIENT_ID =
  process.env.AUTH_PROVIDERS_AZURE_CLIENT_ID;
export const AUTH_PROVIDERS_AZURE_CLIENT_SECRET =
  process.env.AUTH_PROVIDERS_AZURE_CLIENT_SECRET;
export const AUTH_PROVIDERS_AZURE_TENANT_ID =
  process.env.AUTH_PROVIDERS_AZURE_TENANT_ID;
export const AUTH_PROVIDERS_REALM_NAME = process.env.AUTH_PROVIDERS_REALM_NAME;
export const RHSSO76_CLIENTID = process.env.RHSSO76_CLIENT_ID;

export const JDOE_NEW_EMAIL = 'jenny-doe-new-email@example.com';
export const AZURE_LOGIN_FIRSTNAME = 'QE RHDH Testing Admin';
export const AUTH_PROVIDERS_NAMESPACE = 'albarbaro';
export const AUTH_PROVIDERS_RELEASE = 'rhdh-albarbaro';
export const AUTH_PROVIDERS_CHART = 'rhdh-chart/backstage';
export const AUTH_PROVIDERS_VALUES_FILE =
  '../.ibm/pipelines/value_files/values-showcase_auth-providers.yaml';
export const AUTH_PROVIDERS_POD_STRING =
  AUTH_PROVIDERS_RELEASE + '-' + AUTH_PROVIDERS_CHART.split('/')[1];

export const RHSSO76_GROUPS: { [key: string]: GroupRepresentation } = {
  group_1: {
    name: 'group_1',
  },
  group_2: {
    name: 'group_2',
  },
  group_3: {
    name: 'group_3',
  },
  group_4: {
    name: 'group_4',
  },
};

export const RHSSO76_USERS: { [key: string]: UserRepresentation } = {
  user_1: {
    username: 'rhsso_testuser1',
    email: 'rhsso_testuser1@rhdh.test',
    firstName: 'Testuser 1',
    lastName: 'RHSSO',
    emailVerified: true,
    enabled: true,
    attributes: {
      key: 'value',
    },
    credentials: [
      {
        temporary: false,
        type: 'password',
        value: RHSSO76_DEFAULT_PASSWORD,
      },
    ],
    groups: [RHSSO76_GROUPS.group_1.name],
  },
  user_2: {
    username: 'rhsso_testuser2',
    email: 'rhsso_testuser_2@rhdh.test',
    firstName: 'Testuser 2',
    lastName: 'RHSSO',
    emailVerified: true,
    enabled: true,
    attributes: {
      key: 'value',
    },
    credentials: [
      {
        temporary: false,
        type: 'password',
        value: RHSSO76_DEFAULT_PASSWORD,
      },
    ],
    groups: [RHSSO76_GROUPS.group_1.name, RHSSO76_GROUPS.group_2.name],
  },
  jenny_doe: {
    username: 'rhsso_jennydoe',
    email: 'rhsso_jenny-doe@example.com',
    firstName: 'Jenny',
    lastName: 'Doe',
    emailVerified: true,
    enabled: true,
    attributes: {
      key: 'value',
    },
    credentials: [
      {
        temporary: false,
        type: 'password',
        value: RHSSO76_DEFAULT_PASSWORD,
      },
    ],
  },
};

export const RHSSO76_CLIENT: ClientRepresentation = {
  clientId: 'myclient',
  redirectUris: ['*', '/*'],
  webOrigins: ['/*'],
  serviceAccountsEnabled: true,
  standardFlowEnabled: true,
  authorizationServicesEnabled: true,
  directAccessGrantsEnabled: true,
  implicitFlowEnabled: true,
};

export const MSGRAPH_SETTINGS: AppSettings = {
  clientId: AUTH_PROVIDERS_AZURE_CLIENT_ID,
  clientSecret: AUTH_PROVIDERS_AZURE_CLIENT_SECRET,
  tenantId: AUTH_PROVIDERS_AZURE_TENANT_ID,
};

export interface AppSettings {
  clientId: string;
  clientSecret: string;
  tenantId: string;
}

export const MSGRAPH_USERS: { [key: string]: User } = {
  user_1: {
    accountEnabled: true,
    displayName: 'QE Test 1',
    mailNickname: 'RHDH1',
    mail: 'rhdhtest1@rhdhtesting.onmicrosoft.com',
    userPrincipalName: 'rhdhtest1@rhdhtesting.onmicrosoft.com',
    passwordProfile: {
      forceChangePasswordNextSignIn: false,
      password: RHSSO76_DEFAULT_PASSWORD,
    },
  },
  user_2: {
    accountEnabled: true,
    displayName: 'QE Test 2',
    mailNickname: 'RHDH2',
    mail: 'rhdhtest_2@rhdhtesting.onmicrosoft.com',
    userPrincipalName: 'rhdhtest_2@rhdhtesting.onmicrosoft.com',
    passwordProfile: {
      forceChangePasswordNextSignIn: false,
      password: RHSSO76_DEFAULT_PASSWORD,
    },
  },
  user_3: {
    accountEnabled: true,
    displayName: 'QE Test 3',
    mailNickname: 'RHDH3',
    mail: 'rhdhtest_3@rhdhtesting.onmicrosoft.com',
    userPrincipalName: 'rhdhtest_3@rhdhtesting.onmicrosoft.com',
    passwordProfile: {
      forceChangePasswordNextSignIn: false,
      password: RHSSO76_DEFAULT_PASSWORD,
    },
  },
  user_4: {
    accountEnabled: true,
    displayName: 'QE Test 4',
    mailNickname: 'RHDH4',
    mail: 'rhdhtest_4@rhdhtesting.onmicrosoft.com',
    userPrincipalName: 'rhdhtest_4@rhdhtesting.onmicrosoft.com',
    passwordProfile: {
      forceChangePasswordNextSignIn: false,
      password: RHSSO76_DEFAULT_PASSWORD,
    },
  },
  user_5: {
    accountEnabled: true,
    displayName: 'QE Test 5',
    mailNickname: 'RHDH5',
    mail: 'rhdhtest_5@rhdhtesting.onmicrosoft.com',
    userPrincipalName: 'rhdhtest_5@rhdhtesting.onmicrosoft.com',
    passwordProfile: {
      forceChangePasswordNextSignIn: false,
      password: RHSSO76_DEFAULT_PASSWORD,
    },
  },
  user_6: {
    accountEnabled: true,
    displayName: 'QE Test 6',
    mailNickname: 'RHDH6',
    mail: 'rhdhtest_6@rhdhtesting.onmicrosoft.com',
    userPrincipalName: 'rhdhtest_6@rhdhtesting.onmicrosoft.com',
    passwordProfile: {
      forceChangePasswordNextSignIn: false,
      password: RHSSO76_DEFAULT_PASSWORD,
    },
  },
  jenny_doe: {
    accountEnabled: true,
    displayName: 'QE Jenny Doe',
    mailNickname: 'JDoe',
    mail: 'jennydoe@rhdhtesting.onmicrosoft.com',
    userPrincipalName: 'jennydoe@rhdhtesting.onmicrosoft.com',
    passwordProfile: {
      forceChangePasswordNextSignIn: false,
      password: RHSSO76_DEFAULT_PASSWORD,
    },
  },
};

export const MSGRAPH_GROUPS: { [key: string]: Group } = {
  group_1: {
    description: 'Group 1 for RHDH test automation - DO NOT USE/EDIT/DELETE',
    displayName: 'rhdh_test_group_1',
    groupTypes: [],
    mailEnabled: false,
    mailNickname: 'rhdh_test_group_1',
    securityEnabled: true,
  },
  group_2: {
    description: 'Group 2 for RHDH test automation - DO NOT USE/EDIT/DELETE',
    displayName: 'rhdh_test_group_2',
    groupTypes: [],
    mailEnabled: false,
    mailNickname: 'rhdh_test_group_2',
    securityEnabled: true,
  },
  group_3: {
    description: 'Group 3 for RHDH test automation - DO NOT USE/EDIT/DELETE',
    displayName: 'rhdh_test_group_3',
    groupTypes: [],
    mailEnabled: false,
    mailNickname: 'rhdh_test_group_3',
    securityEnabled: true,
  },
  group_4: {
    description: 'Group 4 for RHDH test automation - DO NOT USE/EDIT/DELETE',
    displayName: 'rhdh_test_group_4',
    groupTypes: [],
    mailEnabled: false,
    mailNickname: 'rhdh_test_group_4',
    securityEnabled: true,
  },
  group_5: {
    description: 'Group 5 for RHDH test automation - DO NOT USE/EDIT/DELETE',
    displayName: 'rhdh_test_group_5',
    groupTypes: [],
    mailEnabled: false,
    mailNickname: 'rhdh_test_group_5',
    securityEnabled: true,
  },
  group_6: {
    description: 'Group 6 for RHDH test automation - DO NOT USE/EDIT/DELETE',
    displayName: 'rhdh_test_group_6',
    groupTypes: [],
    mailEnabled: false,
    mailNickname: 'rhdh_test_group_6',
    securityEnabled: true,
  },
};
