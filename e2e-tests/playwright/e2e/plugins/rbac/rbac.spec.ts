import { test, Page, expect } from '@playwright/test';
import { UIhelper } from '../../../utils/UIhelper';
import { Common } from '../../../utils/Common';
import { Roles } from '../../../support/pages/rbac';
import {
  HomePagePO,
  RoleFormPO,
  RoleListPO,
  RoleOverviewPO,
} from '../../../support/pageObjects/page-obj';
import { UIhelperPO } from '../../../support/pageObjects/global-obj';

test.describe.serial('Test RBAC plugin as an admin user', () => {
  let common: Common;
  let uiHelper: UIhelper;
  let page: Page;
  let rolesHelper: Roles;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    uiHelper = new UIhelper(page);
    common = new Common(page);
    rolesHelper = new Roles(page);
    await common.loginAsGithubUser();
    await uiHelper.openSidebar('Administration');
    await uiHelper.verifyHeading('Administration');
    await uiHelper.verifyLink('RBAC');
    await uiHelper.clickTab('RBAC');
  });

  test('Check if Administration side nav is present with RBAC tab', async () => {
    await uiHelper.verifyHeading('All roles (2)');
    const allGridColumnsText = Roles.getRolesListColumnsText();
    await uiHelper.verifyColumnHeading(allGridColumnsText);
    const allCellsIdentifier = Roles.getRolesListCellsIdentifier();
    await uiHelper.verifyCellsInTable(allCellsIdentifier);
  });

  test('View details of a role', async () => {
    await uiHelper.clickLink('role:default/rbac_admin');

    await uiHelper.verifyHeading('role:default/rbac_admin');
    await uiHelper.clickTab('Overview');

    await uiHelper.verifyText('About');

    await uiHelper.verifyHeading('Users and groups (1 user');
    const usersAndGroupsColumnsText = Roles.getUsersAndGroupsListColumnsText();
    await uiHelper.verifyColumnHeading(usersAndGroupsColumnsText);
    const usersAndGroupsCellsIdentifier =
      Roles.getUsersAndGroupsListCellsIdentifier();
    await uiHelper.verifyCellsInTable(usersAndGroupsCellsIdentifier);

    await uiHelper.verifyHeading('Permission policies (9)');
    const permissionPoliciesColumnsText =
      Roles.getPermissionPoliciesListColumnsText();
    await uiHelper.verifyColumnHeading(permissionPoliciesColumnsText);
    const permissionPoliciesCellsIdentifier =
      Roles.getPermissionPoliciesListCellsIdentifier();
    await uiHelper.verifyCellsInTable(permissionPoliciesCellsIdentifier);

    await uiHelper.clickLink('RBAC');
  });

  test.skip('Create and edit a role from the roles list page', async () => {
    await rolesHelper.createRole('test-role');
    await page.click(RoleListPO.editRole('role:default/test-role'));
    await uiHelper.verifyHeading('Edit Role');
    await uiHelper.clickButton('Next');
    await page.fill(RoleFormPO.addUsersAndGroups, 'Jonathon Page');
    await page.click(RoleFormPO.selectMember('Jonathon Page'));
    await uiHelper.verifyHeading('Users and groups (3 users, 1 group)');
    await uiHelper.clickButton('Next');
    await uiHelper.clickButton('Next');
    await uiHelper.clickButton('Save');

    await page.locator(HomePagePO.searchBar).waitFor({ state: 'visible' });
    await page.locator(HomePagePO.searchBar).fill('test-role');
    await uiHelper.verifyHeading('All roles (1)');
    const usersAndGroupsLocator = page
      .locator(UIhelperPO.MuiTableCell)
      .filter({ hasText: '3 users, 1 group' });
    await usersAndGroupsLocator.waitFor();
    await expect(usersAndGroupsLocator).toBeVisible();

    await rolesHelper.deleteRole('role:default/test-role');
  });

  test.skip('Edit users and groups and update policies of a role from the overview page', async () => {
    await rolesHelper.createRole('test-role1');
    await uiHelper.clickLink('role:default/test-role1');

    await uiHelper.verifyHeading('role:default/test-role1');
    await uiHelper.clickTab('Overview');

    await page.click(RoleOverviewPO.updateMembers);
    await uiHelper.verifyHeading('Edit Role');
    await page.locator(HomePagePO.searchBar).fill('Guest User');
    await page.click('button[aria-label="Remove"]');
    await uiHelper.verifyHeading('Users and groups (1 user, 1 group)');
    await uiHelper.clickButton('Next');
    await uiHelper.clickButton('Next');
    await uiHelper.clickButton('Save');
    await uiHelper.verifyText(
      'Role role:default/test-role1 updated successfully',
    );
    await uiHelper.verifyHeading('Users and groups (1 user, 1 group)');

    await page.click(RoleOverviewPO.updatePolicies);
    await uiHelper.verifyHeading('Edit Role');
    await page.click(RoleFormPO.addPermissionPolicy);
    await page.click(RoleFormPO.selectPermissionPolicyPlugin(1), {
      timeout: 100000,
    });
    await uiHelper.optionSelector('scaffolder');
    await page.click(RoleFormPO.selectPermissionPolicyPermission(1));
    await uiHelper.optionSelector('scaffolder-template');
    await uiHelper.clickButton('Next');
    await uiHelper.clickButton('Save');
    await uiHelper.verifyText(
      'Role role:default/test-role1 updated successfully',
    );
    await uiHelper.verifyHeading('Permission Policies (3)');

    await rolesHelper.deleteRole('role:default/test-role1');
  });
  test.afterAll(async () => {
    await page.close();
  });
});
