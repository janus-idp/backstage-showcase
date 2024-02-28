export const HomePagePO = {
  searchBar: 'input[aria-label="Search"]',
  MuiAccordion: 'div[class*="MuiAccordion-root-"]',
};

export const CatalogImportPO = {
  componentURL: 'input[name="url"]',
};

export const BackstageShowcasePO = {
  tableNextPage: 'button[aria-label="Next Page"]',
  tablePreviousPage: 'button[aria-label="Previous Page"]',
  tableLastPage: 'button[aria-label="Last Page"]',
  tableFirstPage: 'button[aria-label="First Page"]',
  tableRows: 'table[class*="MuiTable-root-"] tbody tr',
  tablePageSelectBox: 'div[class*="MuiTablePagination-input"]',
};

export const SettingsPagePO = {
  userSettingsMenu: 'button[data-testid="user-settings-menu"]',
  signOut: 'li[data-testid="sign-out"]',
};

export const RoleFormPO = {
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

export const RoleListPO = {
  editRole: (name: string) => `span[data-testid="update-role-${name}"]`,
  deleteRole: (name: string) => `span[data-testid="delete-role-${name}"]`,
};

export const DeleteRolePO = {
  roleName: 'input[name="delete-role"]',
};

export const RoleOverviewPO = {
  updatePolicies: 'span[data-testid="update-policies"]',
  updateMembers: 'span[data-testid="update-members"]',
};
