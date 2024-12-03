/* eslint-disable no-empty-pattern */
import test, { expect, Page } from "@playwright/test";
import { Roles } from "../../../support/pages/rbac";
import { setupBrowser, Common } from "../../../utils/common";
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
};

let myPage: Page;

const base = test.extend<RbacAsAdminFixture>({
  //prettier-ignore
  uiHelper: async ({}, use) => { //NOSONAR
    const uiHelper = new UIhelper(myPage);
    await myPage.goto("/rbac");
    await use(uiHelper);
  },
  //prettier-ignore
  rolesHelper: async ({}, use) => { //NOSONAR
    const rolesHelper = new Roles(myPage);
    await use(rolesHelper);
  },
  //prettier-ignore
  testId: async ({}, use) => { //NOSONAR
    const testId = Date.now().toString();
    const testRole = `test-role-${testId}`;
    const composedRole = `role:default/${testRole}`;
    await use({ testId, testRole, composedRole });
  },
});

base.describe.serial("Test RBAC plugin as an admin user", () => {
  base.beforeAll(async ({ browser }, testInfo) => {
    myPage = (await setupBrowser(browser, testInfo)).page;
    await new Common(myPage).loginAsGithubUser();
  });

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
    async ({ uiHelper, rolesHelper }) => {
      const rbacPo = new RbacPo(myPage);
      const testUser = "Jonathon Page";
      await rbacPo.createRole("test-role", [
        RbacPo.rbacTestUsers.guest,
        RbacPo.rbacTestUsers.tara,
        RbacPo.rbacTestUsers.backstage,
      ]);
      await myPage.click(
        ROLES_PAGE_COMPONENTS.editRole("role:default/test-role"),
      );
      await uiHelper.verifyHeading("Edit Role");
      await uiHelper.clickButton("Next");
      await rbacPo.addUsersAndGroups(testUser);
      await myPage.click(rbacPo.selectMember(testUser));
      await uiHelper.verifyHeading("Users and groups (3 users, 1 group)");
      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Save");
      await uiHelper.verifyText(
        "Role role:default/test-role updated successfully",
      );

      await myPage
        .locator(HOME_PAGE_COMPONENTS.searchBar)
        .waitFor({ state: "visible" });
      await myPage.locator(HOME_PAGE_COMPONENTS.searchBar).fill("test-role");
      await uiHelper.verifyHeading("All roles (1)");
      const usersAndGroupsLocator = myPage
        .locator(UI_HELPER_ELEMENTS.MuiTableCell)
        .filter({ hasText: "3 users, 1 group" });
      await usersAndGroupsLocator.waitFor();
      await expect(usersAndGroupsLocator).toBeVisible();

      await rolesHelper.deleteRole("role:default/test-role");
    },
  );

  base(
    "Edit users and groups and update policies of a role from the overview page",
    async ({ uiHelper, rolesHelper }) => {
      const rbacPo = new RbacPo(myPage);
      await rbacPo.createRole("test-role1", [
        RbacPo.rbacTestUsers.guest,
        RbacPo.rbacTestUsers.tara,
        RbacPo.rbacTestUsers.backstage,
      ]);

      await uiHelper.filterInputPlaceholder("test-role1");

      await uiHelper.clickLink("role:default/test-role1");

      await uiHelper.verifyHeading("role:default/test-role1");
      await uiHelper.clickTab("Overview");

      await myPage.click(ROLE_OVERVIEW_COMPONENTS.updateMembers);
      await uiHelper.verifyHeading("Edit Role");
      await myPage
        .locator(HOME_PAGE_COMPONENTS.searchBar)
        .fill("Guest User".toLowerCase());
      await myPage.click('button[aria-label="Remove"]');
      await uiHelper.verifyHeading("Users and groups (1 user, 1 group)");
      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Save");
      await uiHelper.verifyText(
        "Role role:default/test-role1 updated successfully",
      );
      await uiHelper.verifyHeading("Users and groups (1 user, 1 group)");

      await myPage.click(ROLE_OVERVIEW_COMPONENTS.updatePolicies);
      await uiHelper.verifyHeading("Edit Role");
      await rbacPo.clickAddPermissionPolicy();
      await myPage.click(rbacPo.selectPermissionPolicyPlugin(1), {
        timeout: 10_1000,
      });
      await rbacPo.selectOption("scaffolder");
      await myPage.click(rbacPo.selectPermissionPolicyPermission(1));
      await rbacPo.selectOption("scaffolder-template");
      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Save");
      await uiHelper.verifyText(
        "Role role:default/test-role1 updated successfully",
      );
      await uiHelper.verifyHeading("Permission Policies (3)");

      await rolesHelper.deleteRole("role:default/test-role1");
    },
  );

  base(
    "Create a role with a permission policy per resource type and verify that the only authorized users can access specific resources.",
    async ({ uiHelper, rolesHelper }) => {
      await new RbacPo(myPage).createRole(
        "test-role",
        ["Guest User", "rhdh-qe", "Backstage"],
        "anyOf",
      );

      await myPage
        .locator(HOME_PAGE_COMPONENTS.searchBar)
        .waitFor({ state: "visible" });
      await myPage.locator(HOME_PAGE_COMPONENTS.searchBar).fill("test-role");
      await uiHelper.verifyHeading("All roles (1)");
      await rolesHelper.deleteRole("role:default/test-role");
    },
  );

  base(
    "Admin cannot create a role if there are no rules defined for the selected resource type.",
    async ({ uiHelper, testId }) => {
      const rbacPo = new RbacPo(myPage);
      await uiHelper.clickButton("Create");
      await uiHelper.verifyHeading("Create role");

      await rbacPo.fillRoleName(testId.testRole);
      await rbacPo.next();
      await rbacPo.addUsersAndGroups(RbacPo.rbacTestUsers.guest.toLowerCase());
      await rbacPo.clickSelectMember(RbacPo.rbacTestUsers.guest);
      await rbacPo.next();
      const policy = myPage.locator(rbacPo.selectPermissionPolicyPlugin(0), {
        hasText: RbacPo.rbacTestUsers.guest,
      });

      await policy.first().click();
      await rbacPo.selectOption("catalog");

      await myPage.click(rbacPo.selectPermissionPolicyPermission(0));
      await rbacPo.selectOption("catalog.entity.create");

      await expect(myPage.getByLabel("configure-access")).not.toBeVisible();
      await uiHelper.clickButton("Cancel");
    },
  );

  base(
    "As an RHDH admin, I want to be able to restrict access by using the Not condition to part of the plugin, so that some information is protected from unauthorized access.",
    async ({ uiHelper, testId, rolesHelper }) => {
      const rbacPo = new RbacPo(myPage);
      // TODO: likely
      await rbacPo.createRole(testId.testRole, []);
      await myPage
        .locator(HOME_PAGE_COMPONENTS.searchBar)
        .waitFor({ state: "visible" });
      await myPage
        .locator(HOME_PAGE_COMPONENTS.searchBar)
        .fill(testId.testRole);
      await uiHelper.verifyHeading("All roles (1)");

      await rolesHelper.deleteRole(testId.composedRole);
    },
  );

  base(
    "As an RHDH admin, I want to be able to edit the access rule, so I can keep it up to date and be able to add more plugins in the future.",
    async ({ uiHelper, testId }) => {
      const rbacPo = new RbacPo(myPage);
      // TODO: likely
      await rbacPo.createRole(testId.testRole, []);
      await myPage
        .locator(HOME_PAGE_COMPONENTS.searchBar)
        .waitFor({ state: "visible" });
      await myPage
        .locator(HOME_PAGE_COMPONENTS.searchBar)
        .fill(testId.testRole);
      await uiHelper.verifyHeading("All roles (1)");

      await myPage.click(ROLES_PAGE_COMPONENTS.editRole(testId.composedRole));
      await uiHelper.verifyHeading("Edit Role");
      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Next");

      await myPage.getByLabel("configure-access").click();
      await myPage.getByRole("button", { name: "Condition" }).click();
      await myPage.getByTestId("rules-sidebar").getByLabel("Open").click();
      await myPage.getByText("HAS_SPEC").click();
      await myPage.getByLabel("key *").click();
      await myPage.getByLabel("key *").fill("lifecycle");
      await myPage.getByTestId("save-conditions").click();

      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Save");
      await uiHelper.verifyText(
        `Role ${testId.composedRole} updated successfully`,
      );
    },
  );

  base(
    "As an RHDH admin, I want to be able to remove an access rule from an existing permission policy.",
    async ({ uiHelper, testId }) => {
      base.slow();
      const rbacPo = new RbacPo(myPage);
      // TODO: likely
      await rbacPo.createRole(testId.testRole, []);
      await myPage
        .locator(HOME_PAGE_COMPONENTS.searchBar)
        .waitFor({ state: "visible" });
      await myPage
        .locator(HOME_PAGE_COMPONENTS.searchBar)
        .fill(testId.testRole);
      await uiHelper.verifyHeading("All roles (1)");
      await myPage.reload({ waitUntil: "domcontentloaded" });
      await myPage.click(ROLES_PAGE_COMPONENTS.editRole(testId.composedRole));
      await uiHelper.verifyHeading("Edit Role");
      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Next");

      await myPage.getByLabel("configure-access").click();
      await myPage.getByRole("button", { name: "Remove" }).nth(2).click();
      await myPage.getByTestId("save-conditions").click();
      await uiHelper.verifyText("Configure access (2 rules)");

      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Save");

      await uiHelper.verifyText(
        `Role ${testId.composedRole} updated successfully`,
      );
    },
  );
});
