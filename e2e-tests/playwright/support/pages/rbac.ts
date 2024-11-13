import { APIResponse, Page, expect } from "@playwright/test";
import { UIhelper } from "../../utils/UIhelper";
import { DeleteRolePO, HomePagePO, RoleListPO } from "../pageObjects/page-obj";

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

  //Depending on the version of the Backstage, it can be 'Permission Policies' or 'Accessible Plugins'
  // Accepts either term
  static getRolesListColumnsText() {
    return [
      /^Name$/,
      /^Users and groups$/,
      /Permission Policies|Accessible plugins/,
    ];
  }

  static getUsersAndGroupsListColumnsText() {
    return ["Name", "Type", "Members"];
  }

  static getPermissionPoliciesListColumnsText() {
    return ["Plugin", "Permission", "Policies"];
  }

  async deleteRole(name: string) {
    await this.uiHelper.openSidebar("RBAC");
    await this.uiHelper.filterInputPlaceholder(name);
    const button = this.page.locator(RoleListPO.deleteRole(name));
    await button.waitFor({ state: "visible" });
    await button.click();
    await this.uiHelper.verifyHeading("Delete this role?");
    await this.page.locator(DeleteRolePO.roleName).click();
    await this.page.fill(DeleteRolePO.roleName, name);
    await this.uiHelper.clickButton("Delete");

    await this.uiHelper.verifyText(`Role ${name} deleted successfully`);
    await this.page.locator(HomePagePO.searchBar).fill(name);
    await this.uiHelper.verifyHeading("All roles (0)");
  }
}

interface PolicyComplete {
  entityReference: string;
  permission: string;
  policy: string;
  effect: string;
}

interface Policy {
  permission: string;
  policy: string;
  effect: string;
}

interface Role {
  memberReferences: string[];
  name: string;
}

export class Response {
  private authToken: string;
  private simpleRequest;

  constructor(authToken: string) {
    this.authToken = authToken;
    this.simpleRequest = {
      headers: {
        authorization: authToken,
      },
    };
  }

  getSimpleRequest() {
    return this.simpleRequest;
  }

  editPolicyRequest(oldPolicy: Policy[], newPolicy: Policy[]) {
    return {
      data: {
        oldPolicy,
        newPolicy,
      },
      headers: {
        authorization: this.authToken,
      },
    };
  }

  createOrDeletePolicyRequest(additions: PolicyComplete[]) {
    return {
      data: additions,
      headers: {
        authorization: this.authToken,
      },
    };
  }

  editRoleRequest(oldRole: Role, newRole: Role) {
    return {
      data: {
        oldRole,
        newRole,
      },
      headers: {
        authorization: this.authToken,
      },
    };
  }

  createRoleRequest(role: Role) {
    return {
      data: role,
      headers: {
        authorization: this.authToken,
        "Content-Type": "application/json",
      },
    };
  }

  async removeMetadataFromResponse(response: APIResponse) {
    const responseJson = await response.json();
    const responseClean = responseJson.map((list: any) => {
      delete list.metadata;
      return list;
    });
    return responseClean;
  }

  async checkResponse(response: APIResponse, expected: string) {
    const cleanResponse = await this.removeMetadataFromResponse(response);
    const expectedJson = JSON.parse(expected);
    expect(cleanResponse).toEqual(expectedJson);
  }
}
