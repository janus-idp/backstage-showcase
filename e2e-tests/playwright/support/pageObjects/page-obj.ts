export const HOME_PAGE_COMPONENTS = {
  searchBar: 'input[aria-label="Search"]',
  MuiAccordion: 'div[class*="MuiAccordion-root-"]',
};

export const CATALOG_IMPORT_COMPONENTS = {
  componentURL: 'input[name="url"]',
};

export const BACKSTAGE_SHOWCASE_COMPONENTS = {
  tableNextPage: 'button[aria-label="Next Page"]',
  tablePreviousPage: 'button[aria-label="Previous Page"]',
  tableLastPage: 'button[aria-label="Last Page"]',
  tableFirstPage: 'button[aria-label="First Page"]',
  tableRows: 'table[class*="MuiTable-root-"] tbody tr',
  tablePageSelectBox: 'div[class*="MuiTablePagination-input"]',
};

export const SETTINGS_PAGE_COMPONENTS = {
  userSettingsMenu: 'button[data-testid="user-settings-menu"]',
  signOut: 'li[data-testid="sign-out"]',
};

export const ROLE_FORM_COMPONENTS = {
  roleName: 'input[name="name"]',
  roledescription: 'input[name="description"]',
  addUsersAndGroups: 'input[name="add-users-and-groups"]',
  addPermissionPolicy: 'button[name="add-permission-policy"]',
  selectMember: (label: string) => `span[data-testid="${label}"]`,
  selectPermissionPolicyPlugin: (row: number) =>
    `input[name="permissionPoliciesRows[${row}].plugin"]`,
  selectPermissionPolicyPermission: (row: number) =>
    `input[name="permissionPoliciesRows[${row}].permission"]`,
  selectPolicy: (row: number, policy: number, policyName: string) =>
    `input[name="permissionPoliciesRows[${row}].policies[${policy}].policy-${policyName}"]`,
};

export const ROLE_LIST_COMPONENTS = {
  editRole: (name: string) => `span[data-testid="update-role-${name}"]`,
  deleteRole: (name: string) => `span[data-testid="delete-role-${name}"]`,
};

export const DELETE_ROLE_COMPONENTS = {
  roleName: 'input[name="delete-role"]',
};

export const ROLE_OVERVIEW_COMPONENTS = {
  updatePolicies: 'span[data-testid="update-policies"]',
  updateMembers: 'span[data-testid="update-members"]',
};
