import { APIResponse, Page, expect } from "@playwright/test";
import { UIhelper } from "../../utils/ui-helper";
import {
  DELETE_ROLE_COMPONENTS,
  HOME_PAGE_COMPONENTS,
  ROLES_PAGE_COMPONENTS,
} from "../pageObjects/page-obj";
import { Policy, Role } from "../api/rbac-api-structures";

export class Roles {
  private readonly page: Page;
  private readonly uiHelper: UIhelper;

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
    await this.page.goto("/rbac");
    await this.uiHelper.filterInputPlaceholder(name);
    const button = this.page.locator(ROLES_PAGE_COMPONENTS.deleteRole(name));
    await button.waitFor({ state: "visible" });
    await button.click();
    await this.uiHelper.verifyHeading("Delete this role?");
    await this.page.locator(DELETE_ROLE_COMPONENTS.roleName).click();
    await this.page.fill(DELETE_ROLE_COMPONENTS.roleName, name);
    await this.uiHelper.clickButton("Delete");

    await this.uiHelper.verifyText(`Role ${name} deleted successfully`);
    await this.page.locator(HOME_PAGE_COMPONENTS.searchBar).fill(name);
    await this.uiHelper.verifyHeading("All roles (0)");
  }
}

export class Response {
  static async removeMetadataFromResponse(
    response: APIResponse,
  ): Promise<unknown[]> {
    try {
      const responseJson = await response.json();

      // Validate that the response is an array
      if (!Array.isArray(responseJson)) {
        console.warn(
          `Expected an array but received: ${JSON.stringify(responseJson)}`,
        );
        return []; // Return an empty array as a fallback
      }

      // Clean metadata from the response
      const responseClean = responseJson.map((item: { metadata: unknown }) => {
        if (item.metadata) {
          delete item.metadata;
        }
        return item;
      });

      return responseClean;
    } catch (error) {
      console.error("Error processing API response:", error);
      throw new Error("Failed to process the API response");
    }
  }

  static async checkResponse(
    response: APIResponse,
    expected: Role[] | Policy[],
  ) {
    const cleanResponse = await this.removeMetadataFromResponse(response);
    expect(cleanResponse).toEqual(expected);
  }
}
