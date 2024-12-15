/* eslint-disable no-empty-pattern */
import test, { expect } from "@playwright/test";
import { Roles } from "../../../support/pages/rbac";
import { Common } from "../../../utils/common";
import { UIhelper } from "../../../utils/ui-helper";
import { UI_HELPER_ELEMENTS } from "../../../support/pageObjects/global-obj";
import {
  ROLES_PAGE_COMPONENTS,
  HOME_PAGE_COMPONENTS,
  ROLE_OVERVIEW_COMPONENTS,
} from "../../../support/pageObjects/page-obj";
import { RbacPo } from "../../../support/pageObjects/rbac-po";

type RbacAsAdminFixture = {
  uiHelper: UIhelper;
  rolesHelper: Roles;
  testId: { testId: string; testRole: string; composedRole: string };
  rbacPo: RbacPo;
};

/*
    Note that:
    The policies generated from a policy.csv or ConfigMap file cannot be edited or deleted using the Developer Hub Web UI. 
    https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.2/html/authorization/proc-rbac-ui-manage-roles_title-authorization#proc-rbac-ui-edit-role_title-authorization
*/

const base = test.extend<RbacAsAdminFixture>({
  //prettier-ignore
  uiHelper: async ({page}, use) => { //NOSONAR
    const uiHelper = new UIhelper(page);
    await new Common(page).loginAsKeycloakUser();
    await page.goto("/rbac");
    await use(uiHelper);
  },
  //prettier-ignore
  rolesHelper: async ({page}, use) => { //NOSONAR
    const rolesHelper = new Roles(page);
    await use(rolesHelper);
  },
  //prettier-ignore
  testId: async ({}, use) => { //NOSONAR
    const testId = Date.now().toString();
    const testRole = `test-role-${testId}`;
    const composedRole = `role:default/${testRole}`;
    await use({ testId, testRole, composedRole });
  },
  //prettier-ignore
  rbacPo: async ({page}, use) => { //NOSONAR
    use( new RbacPo(page))
  },
});

base.describe.serial("Test RBAC plugin as an admin user", () => {
  base(
    "Check if Administration side nav is present with RBAC plugin",
    async ({ uiHelper }) => {
      await uiHelper.verifyHeading(/All roles \(\d+\)/);
      const allGridColumnsText = Roles.getRolesListColumnsText();
      await uiHelper.verifyColumnHeading(allGridColumnsText);
      const allCellsIdentifier = Roles.getRolesListCellsIdentifier();
      await uiHelper.verifyCellsInTable(allCellsIdentifier);
    },
  );

  base(
    "Check if permission policies defined in files are loaded",
    async ({ page }) => {
      const uiHelper = new UIhelper(page);

      const testRole: string = "role:default/test2-role";

      await uiHelper.verifyHeading(/All roles \(\d+\)/);
      await uiHelper.verifyLink(testRole);
      await uiHelper.clickLink(testRole);

      await uiHelper.verifyHeading(testRole);
      await uiHelper.clickTab("Overview");

      await uiHelper.verifyText("About");
      await uiHelper.verifyText("csv permission policy file");

      await uiHelper.verifyHeading("Users and groups (1 group");
      await uiHelper.verifyHeading("Permission policies (2)");
      const permissionPoliciesColumnsText =
        Roles.getPermissionPoliciesListColumnsText();
      await uiHelper.verifyColumnHeading(permissionPoliciesColumnsText);
      const permissionPoliciesCellsIdentifier =
        Roles.getPermissionPoliciesListCellsIdentifier();
      await uiHelper.verifyCellsInTable(permissionPoliciesCellsIdentifier);

      await expect(page.getByRole("article")).toContainText("catalog-entity");
      await expect(page.getByRole("article")).toContainText("Read, Update");
      await expect(page.getByRole("article")).toContainText("Delete");
    },
  );

  base("View details of a role", async ({ uiHelper }) => {
    await uiHelper.clickLink("role:default/rbac_admin");

    await uiHelper.verifyHeading("role:default/rbac_admin");
    await uiHelper.clickTab("Overview");

    await uiHelper.verifyText("About");

    await uiHelper.verifyHeading("Users and groups (1 user");
    const usersAndGroupsColumnsText = Roles.getUsersAndGroupsListColumnsText();
    await uiHelper.verifyColumnHeading(usersAndGroupsColumnsText);
    const usersAndGroupsCellsIdentifier =
      Roles.getUsersAndGroupsListCellsIdentifier();
    await uiHelper.verifyCellsInTable(usersAndGroupsCellsIdentifier);

    await uiHelper.verifyHeading("Permission policies (5)");
    const permissionPoliciesColumnsText =
      Roles.getPermissionPoliciesListColumnsText();
    await uiHelper.verifyColumnHeading(permissionPoliciesColumnsText);
    const permissionPoliciesCellsIdentifier =
      Roles.getPermissionPoliciesListCellsIdentifier();
    await uiHelper.verifyCellsInTable(permissionPoliciesCellsIdentifier);
  });

  base(
    "Create and edit a role from the roles list page",
    async ({ uiHelper, rolesHelper, page, testId, rbacPo }) => {
      const testUser = "Jonathon Page";
      await rbacPo.createRole(testId.testRole, [
        RbacPo.rbacTestUsers.guest,
        RbacPo.rbacTestUsers.tara,
        RbacPo.rbacTestUsers.backstage,
      ]);
      await page.click(
        ROLES_PAGE_COMPONENTS.editRole("role:default/" + testId.testRole),
      );
      await uiHelper.verifyHeading("Edit Role");
      await uiHelper.clickButton("Next");
      await rbacPo.addUsersAndGroups(testUser);
      await page.click(rbacPo.selectMember(testUser));
      await uiHelper.verifyHeading("Users and groups (3 users, 1 group)");
      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Save");
      await uiHelper.verifyText(
        "Role role:default/test-role updated successfully",
      );

      await page
        .locator(HOME_PAGE_COMPONENTS.searchBar)
        .waitFor({ state: "visible" });
      await page.locator(HOME_PAGE_COMPONENTS.searchBar).fill(testId.testRole);
      await uiHelper.verifyHeading("All roles (1)");
      const usersAndGroupsLocator = page
        .locator(UI_HELPER_ELEMENTS.MuiTableCell)
        .filter({ hasText: "3 users, 1 group" });
      await usersAndGroupsLocator.waitFor();
      await expect(usersAndGroupsLocator).toBeVisible();

      await rolesHelper.deleteRole(testId.composedRole);
    },
  );

  base(
    "Edit users and groups and update policies of a role from the overview page",
    async ({ uiHelper, rolesHelper, page, testId, rbacPo }) => {
      await rbacPo.createRole(testId.testRole, [
        RbacPo.rbacTestUsers.guest,
        RbacPo.rbacTestUsers.tara,
        RbacPo.rbacTestUsers.backstage,
      ]);

      await uiHelper.filterInputPlaceholder(testId.testRole);

      await uiHelper.clickLink(testId.composedRole);

      await uiHelper.verifyHeading(testId.composedRole);
      await uiHelper.clickTab("Overview");

      await page.click(ROLE_OVERVIEW_COMPONENTS.updateMembers);
      await uiHelper.verifyHeading("Edit Role");
      await page
        .locator(HOME_PAGE_COMPONENTS.searchBar)
        .fill("Guest User".toLowerCase());
      await page.click('button[aria-label="Remove"]');
      await uiHelper.verifyHeading("Users and groups (1 user, 1 group)");
      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Save");
      await uiHelper.verifyText(
        `Role ${testId.composedRole} updated successfully`,
      );
      await uiHelper.verifyHeading("Users and groups (1 user, 1 group)");

      await page.click(ROLE_OVERVIEW_COMPONENTS.updatePolicies);
      await uiHelper.verifyHeading("Edit Role");
      await rbacPo.clickAddPermissionPolicy();
      await page.click(rbacPo.selectPermissionPolicyPlugin(1), {
        timeout: 10_1000,
      });
      await rbacPo.selectOption("scaffolder");
      await page.click(rbacPo.selectPermissionPolicyPermission(1));
      await rbacPo.selectOption("scaffolder-template");
      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Save");
      await uiHelper.verifyText(
        `Role ${testId.composedRole} updated successfully`,
      );
      await uiHelper.verifyHeading("Permission Policies (3)");

      await rolesHelper.deleteRole(testId.composedRole);
    },
  );

  base(
    "Create a role with a permission policy per resource type and verify that the only authorized users can access specific resources.",
    async ({ uiHelper, rolesHelper, page, testId, rbacPo }) => {
      await rbacPo.createRole(
        testId.testRole,
        ["Guest User", "rhdh-qe", "Backstage"],
        "anyOf",
      );

      await page
        .locator(HOME_PAGE_COMPONENTS.searchBar)
        .waitFor({ state: "visible" });
      await page.locator(HOME_PAGE_COMPONENTS.searchBar).fill(testId.testRole);
      await uiHelper.verifyHeading("All roles (1)");
      await rolesHelper.deleteRole(testId.composedRole);
    },
  );

  base(
    "Admin cannot create a role if there are no rules defined for the selected resource type.",
    async ({ uiHelper, testId, page, rbacPo }) => {
      await uiHelper.clickButton("Create");
      await uiHelper.verifyHeading("Create role");

      await rbacPo.fillRoleName(testId.testRole);
      await rbacPo.next();
      await rbacPo.addUsersAndGroups(RbacPo.rbacTestUsers.guest.toLowerCase());
      await rbacPo.clickSelectMember(RbacPo.rbacTestUsers.guest);
      await rbacPo.next();
      const policy = page.locator(rbacPo.selectPermissionPolicyPlugin(0), {
        hasText: RbacPo.rbacTestUsers.guest,
      });

      await policy.first().click();
      await rbacPo.selectOption("catalog");

      await page.click(rbacPo.selectPermissionPolicyPermission(0));
      await rbacPo.selectOption("catalog.entity.create");

      await expect(page.getByLabel("configure-access")).not.toBeVisible();
      await uiHelper.clickButton("Cancel");
    },
  );

  base(
    "As an RHDH admin, I want to be able to restrict access by using the Not condition to part of the plugin, so that some information is protected from unauthorized access.",
    async ({ uiHelper, testId, rolesHelper, page, rbacPo }) => {
      // TODO: likely
      await rbacPo.createRole(testId.testRole, []);
      await page
        .locator(HOME_PAGE_COMPONENTS.searchBar)
        .waitFor({ state: "visible" });
      await page.locator(HOME_PAGE_COMPONENTS.searchBar).fill(testId.testRole);
      await uiHelper.verifyHeading("All roles (1)");

      await rolesHelper.deleteRole(testId.composedRole);
    },
  );

  base(
    "As an RHDH admin, I want to be able to edit the access rule, so I can keep it up to date and be able to add more plugins in the future.",
    async ({ uiHelper, testId, page, rbacPo }) => {
      // TODO: likely
      await rbacPo.createRole(testId.testRole, []);
      await page
        .locator(HOME_PAGE_COMPONENTS.searchBar)
        .waitFor({ state: "visible" });
      await page.locator(HOME_PAGE_COMPONENTS.searchBar).fill(testId.testRole);
      await uiHelper.verifyHeading("All roles (1)");

      await page.click(ROLES_PAGE_COMPONENTS.editRole(testId.composedRole));
      await uiHelper.verifyHeading("Edit Role");
      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Next");

      await page.getByLabel("configure-access").click();
      await page.getByRole("button", { name: "Condition" }).click();
      await page.getByTestId("rules-sidebar").getByLabel("Open").click();
      await page.getByText("HAS_SPEC").click();
      await page.getByLabel("key *").click();
      await page.getByLabel("key *").fill("lifecycle");
      await page.getByTestId("save-conditions").click();

      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Save");
      await uiHelper.verifyText(
        `Role ${testId.composedRole} updated successfully`,
      );
    },
  );

  base(
    "As an RHDH admin, I want to be able to remove an access rule from an existing permission policy.",
    async ({ uiHelper, testId, page, rbacPo }) => {
      // TODO: likely
      await rbacPo.createRole(testId.testRole, []);
      await page
        .locator(HOME_PAGE_COMPONENTS.searchBar)
        .waitFor({ state: "visible" });
      await page.locator(HOME_PAGE_COMPONENTS.searchBar).fill(testId.testRole);
      await uiHelper.verifyHeading("All roles (1)");
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.click(ROLES_PAGE_COMPONENTS.editRole(testId.composedRole));
      await uiHelper.verifyHeading("Edit Role");
      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Next");

      await page.getByLabel("configure-access").click();
      await page.getByRole("button", { name: "Remove" }).nth(2).click();
      await page.getByTestId("save-conditions").click();
      await uiHelper.verifyText("Configure access (2 rules)");

      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Save");

      await uiHelper.verifyText(
        `Role ${testId.composedRole} updated successfully`,
      );
    },
  );
});
