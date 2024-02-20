import { Page } from '@playwright/test';
import { UIhelper } from '../../utils/UIhelper';
import {
  DeleteRolePO,
  HomePagePO,
  RoleFormPO,
  RoleListPO,
} from '../pageObjects/page-obj';

export class Roles {
  private page: Page;
  private uiHelper: UIhelper;

  constructor(page: Page) {
    this.page = page;
    this.uiHelper = new UIhelper(page);
  }
  static getRolesListCellsIdentifier() {
    const roleName = new RegExp(/^(role|user|group):[a-zA-Z]+\/[\w@*.~-]+$/);
    const usersAndGroups = new RegExp(
      /^(1\s(user|group)|[2-9]\s(users|groups))(, (1\s(user|group)|[2-9]\s(users|groups)))?$/,
    );
    const permissionPolicies = /\d/;
    return [roleName, usersAndGroups, permissionPolicies];
  }

  static getUsersAndGroupsListCellsIdentifier() {
    const name = new RegExp(/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/);
    const type = new RegExp(/^(User|Group)$/);
    const members = /^(-|\d+)$/;
    return [name, type, members];
  }

  static getPermissionPoliciesListCellsIdentifier() {
    const policies =
      /^(?:(Read|Create|Update|Delete)(?:, (?:Read|Create|Update|Delete))*|Use)$/;
    return [policies];
  }

  static getRolesListColumnsText() {
    return ['Name', 'Users and groups', 'Permission Policies', 'Actions'];
  }

  static getUsersAndGroupsListColumnsText() {
    return ['Name', 'Type', 'Members'];
  }

  static getPermissionPoliciesListColumnsText() {
    return ['Plugin', 'Permission', 'Policies'];
  }

  async createRole(name: string) {
    await this.uiHelper.clickButton('Create');

    await this.uiHelper.verifyHeading('Create role');

    await this.page.fill(RoleFormPO.roleName, name);
    await this.uiHelper.clickButton('Next');
    await this.page.fill(RoleFormPO.addUsersAndGroups, 'guest user');
    await this.page.click(RoleFormPO.selectMember('Guest User'));
    await this.page.fill(RoleFormPO.addUsersAndGroups, 'tara');
    await this.page.click(RoleFormPO.selectMember('Tara MacGovern'));
    await this.page.fill(RoleFormPO.addUsersAndGroups, 'Backstage');
    await this.page.click(RoleFormPO.selectMember('Backstage'));
    await this.uiHelper.verifyHeading('Users and groups (2 users, 1 group)');
    await this.uiHelper.clickButton('Next');

    await this.page.click(RoleFormPO.selectPermissionPolicyPlugin(0), {
      timeout: 100000,
    });
    await this.uiHelper.optionSelector('catalog');
    await this.page.click(RoleFormPO.selectPermissionPolicyPermission(0));
    await this.uiHelper.optionSelector('catalog-entity');
    await this.page.uncheck(RoleFormPO.selectPolicy(0, 1, 'Delete'));

    await this.uiHelper.clickButton('Next');

    await this.uiHelper.verifyHeading('Review and create');
    await this.uiHelper.verifyText('Users and groups (2 users, 1 group)');
    await this.uiHelper.verifyText('Permission policies (2)');

    await this.uiHelper.clickButton('Create');

    await this.page.locator(HomePagePO.searchBar).waitFor({ timeout: 60000 });
    await this.page.locator(HomePagePO.searchBar).fill(name);
    await this.uiHelper.verifyHeading('All roles (1)');
  }

  async deleteRole(name: string) {
    await this.uiHelper.openSidebar('Administration');
    await this.uiHelper.clickTab('RBAC');
    const button = this.page.locator(RoleListPO.deleteRole(name));
    await button.waitFor({ state: 'visible' });
    await button.click();
    await this.uiHelper.verifyHeading('Delete this role?');
    await this.page.locator(DeleteRolePO.roleName).click();
    await this.page.fill(DeleteRolePO.roleName, name);
    await this.uiHelper.clickButton('Delete');

    await this.uiHelper.verifyText(`Role ${name} deleted successfully`);
    await this.page.locator(HomePagePO.searchBar).fill(name);
    await this.uiHelper.verifyHeading('All roles (0)');
  }
}
