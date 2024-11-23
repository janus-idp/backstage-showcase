/* eslint-disable no-empty-pattern */
import test, { expect, Page } from "@playwright/test";
import { UIhelperPO } from "../../../support/pageObjects/global-obj";
import {
  RoleListPO,
  RoleFormPO,
  HomePagePO,
  RoleOverviewPO,
} from "../../../support/pageObjects/page-obj";
import { Common, setupBrowser } from "../../../utils/Common";
import { UIhelper } from "../../../utils/UIhelper";
import { Roles } from "../../../support/pages/rbac";

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
    async ({ uiHelper, testId, rolesHelper }) => {
      await rolesHelper.createRole(testId.testRole);
      await myPage.click(RoleListPO.editRole(testId.composedRole));
      await uiHelper.verifyHeading("Edit Role");
      await uiHelper.clickButton("Next");
      await myPage.fill(RoleFormPO.addUsersAndGroups, "Jonathon Page");
      await myPage.click(RoleFormPO.selectMember("Jonathon Page"));
      await uiHelper.verifyHeading("Users and groups (3 users, 1 group)");
      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Save");
      await uiHelper.verifyText(
        `Role ${testId.composedRole} updated successfully`,
      );
      await myPage.locator(HomePagePO.searchBar).waitFor({ state: "visible" });
      await myPage.locator(HomePagePO.searchBar).fill(testId.testRole);
      await uiHelper.verifyHeading("All roles (1)");
      const usersAndGroupsLocator = myPage
        .locator(UIhelperPO.MuiTableCell)
        .filter({ hasText: "3 users, 1 group" });
      await usersAndGroupsLocator.waitFor();
      await expect(usersAndGroupsLocator).toBeVisible();
      await rolesHelper.deleteRole(testId.composedRole);
    },
  );

  base(
    "Edit users and groups and update policies of a role from the overview page",
    async ({ uiHelper, testId, rolesHelper }) => {
      await rolesHelper.createRole(testId.testRole);
      await uiHelper.clickLink(testId.composedRole);

      await uiHelper.verifyHeading(testId.composedRole);
      await uiHelper.clickTab("Overview");

      await myPage.click(RoleOverviewPO.updateMembers);
      await uiHelper.verifyHeading("Edit Role");
      await myPage.locator(HomePagePO.searchBar).fill("Guest User");
      await myPage.click('button[aria-label="Remove"]');
      await uiHelper.verifyHeading("Users and groups (1 user, 1 group)");
      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Next");
      await uiHelper.clickButton("Save");
      await uiHelper.verifyText(
        `Role ${testId.composedRole} updated successfully`,
      );
      await uiHelper.verifyHeading("Users and groups (1 user, 1 group)");

      await myPage.click(RoleOverviewPO.updatePolicies);
      await uiHelper.verifyHeading("Edit Role");
      await myPage.click(RoleFormPO.addPermissionPolicy);
      await myPage.click(RoleFormPO.selectPermissionPolicyPlugin(1));
      await uiHelper.optionSelector("scaffolder");
      await myPage.click(RoleFormPO.selectPermissionPolicyPermission(1));
      await uiHelper.optionSelector("scaffolder-template");
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
    async ({ uiHelper, rolesHelper, testId }) => {
      await rolesHelper.createRoleWithPermissionPolicy(testId.testRole);

      await myPage.locator(HomePagePO.searchBar).waitFor({ state: "visible" });
      await myPage.locator(HomePagePO.searchBar).fill(testId.testRole);
      await uiHelper.verifyHeading("All roles (1)");
      await rolesHelper.deleteRole(testId.composedRole);
    },
  );

  base(
    "Admin cannot create a role if there are no rules defined for the selected resource type.",
    async ({ uiHelper, testId }) => {
      await uiHelper.clickButton("Create");
      await uiHelper.verifyHeading("Create role");

      await myPage.fill(RoleFormPO.roleName, testId.testRole);
      await uiHelper.clickButton("Next");
      await myPage.fill(RoleFormPO.addUsersAndGroups, "guest user");
      await myPage.click(RoleFormPO.selectMember("Guest User"));
      await uiHelper.clickButton("Next");

      await myPage.click(RoleFormPO.selectPermissionPolicyPlugin(0));
      await uiHelper.optionSelector("catalog");

      await myPage.click(RoleFormPO.selectPermissionPolicyPermission(0));
      await uiHelper.optionSelector("catalog.entity.create");

      await expect(myPage.getByLabel("configure-access")).not.toBeVisible();
      await uiHelper.clickButton("Cancel");
    },
  );

  base(
    "As an RHDH admin, I want to be able to restrict access by using the Not condition to part of the plugin, so that some information is protected from unauthorized access.",
    async ({ uiHelper, testId, rolesHelper }) => {
      await rolesHelper.createRoleWithNotPermissionPolicy(testId.testRole);
      await myPage.locator(HomePagePO.searchBar).waitFor({ state: "visible" });
      await myPage.locator(HomePagePO.searchBar).fill(testId.testRole);
      await uiHelper.verifyHeading("All roles (1)");

      await rolesHelper.deleteRole(testId.composedRole);
    },
  );

  base(
    "As an RHDH admin, I want to be able to edit the access rule, so I can keep it up to date and be able to add more plugins in the future.",
    async ({ uiHelper, rolesHelper, testId }) => {
      await rolesHelper.createRoleWithNotPermissionPolicy(testId.testRole);
      await myPage.locator(HomePagePO.searchBar).waitFor({ state: "visible" });
      await myPage.locator(HomePagePO.searchBar).fill(testId.testRole);
      await uiHelper.verifyHeading("All roles (1)");

      await myPage.click(RoleListPO.editRole(testId.composedRole));
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
    async ({ uiHelper, rolesHelper, testId }) => {
      await rolesHelper.createRoleWithPermissionPolicy(testId.testRole);
      await myPage.locator(HomePagePO.searchBar).waitFor({ state: "visible" });
      await myPage.locator(HomePagePO.searchBar).fill(testId.testRole);
      await uiHelper.verifyHeading("All roles (1)");
      await myPage.reload({ waitUntil: "domcontentloaded" });
      await myPage.click(RoleListPO.editRole(testId.composedRole));
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
