import { Page, expect, test } from "@playwright/test";
import { UIhelperPO } from "../../../support/pageObjects/global-obj";
import {
  HomePagePO,
  RoleFormPO,
  RoleListPO,
  RoleOverviewPO,
} from "../../../support/pageObjects/page-obj";
import { Roles } from "../../../support/pages/rbac";
import { Common } from "../../../utils/Common";
import { UIhelper } from "../../../utils/UIhelper";
import {
  GH_USER_IDAuthFile,
  GH_USER2_IDAuthFile,
} from "../../../support/auth/auth_constants";

test.use({ storageState: GH_USER_IDAuthFile });
test.describe
  .serial("Test RBAC plugin: load permission policies and conditions from files", () => {
  let uiHelper: UIhelper;
  let page: Page;

  test.beforeEach(async ({ page }) => {
    uiHelper = new UIhelper(page);
    await new Common(page).logintoGithub();
    await uiHelper.openSidebarButton("Administration");
    await uiHelper.openSidebar("RBAC");
    await uiHelper.verifyHeading("RBAC");
  });

  test("Check if permission policies defined in files are loaded and effective", async () => {
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

    await page.getByTestId("update-members").getByLabel("Update").click();
    await expect(page.locator("tbody")).toContainText("rhdh-qe-2-team");
    await uiHelper.clickButton("Next");
    await page.getByLabel("configure-access").first().click();
    await expect(page.getByPlaceholder("string, string")).toHaveValue(
      "group:janus-qe/rhdh-qe-2-team,$currentUser",
    );
    await page.getByTestId("cancel-conditions").click();
    await page.getByLabel("configure-access").nth(1).click();
    await expect(page.getByPlaceholder("string, string")).toHaveValue(
      "$currentUser",
    );
    await page.getByTestId("cancel-conditions").click();
    await uiHelper.clickButton("Next");
    await uiHelper.clickButton("Cancel");
  });
});

test.describe
  .serial("Test RBAC plugin: Aliases used in conditional access policies", () => {
  test.use({ storageState: GH_USER2_IDAuthFile });

  test.beforeEach(async ({ page }) => {
    await new Common(page).logintoGithub();
  });

  test("Check if aliases used in conditions: the user is allowed to unregister only components they own, not those owned by the group.", async ({
    page,
  }) => {
    const uiHelper = new UIhelper(page);
    await uiHelper.openSidebar("Catalog");
    await uiHelper.selectMuiBox("Kind", "Component");

    await uiHelper.searchInputPlaceholder("test-rhdh-qe-2");
    await page
      .getByRole("link", { name: "test-rhdh-qe-2", exact: true })
      .click();

    await expect(page.locator("header")).toContainText("user:rhdh-qe-2");
    await page.getByTestId("menu-button").click();
    const unregisterUserOwned = page.getByText("Unregister entity");
    await expect(unregisterUserOwned).toBeEnabled();

    await page.getByText("Unregister entity").click();
    await expect(page.getByRole("heading")).toContainText(
      "Are you sure you want to unregister this entity?",
    );
    await page.getByRole("button", { name: "Cancel" }).click();

    await uiHelper.openSidebar("Catalog");
    await page.getByRole("link", { name: "test-rhdh-qe-2-team-owned" }).click();
    await expect(page.locator("header")).toContainText(
      "janus-qe/rhdh-qe-2-team",
    );
    await page.getByTestId("menu-button").click();
    const unregisterGroupOwned = page.getByText("Unregister entity");
    await expect(unregisterGroupOwned).toBeDisabled();
  });
});

test.describe.serial("Test RBAC plugin as an admin user", () => {
  test.use({ storageState: GH_USER_IDAuthFile });

  test.beforeEach(async ({ page }) => {
    const uiHelper = new UIhelper(page);
    await new Common(page).logintoGithub();
    await uiHelper.openSidebarButton("Administration");
    await uiHelper.openSidebar("RBAC");
    await uiHelper.verifyHeading("RBAC");
  });

  test("Check if Administration side nav is present with RBAC plugin", async ({
    page,
  }) => {
    const uiHelper = new UIhelper(page);
    await uiHelper.verifyHeading(/All roles \(\d+\)/);
    const allGridColumnsText = Roles.getRolesListColumnsText();
    await uiHelper.verifyColumnHeading(allGridColumnsText);
    const allCellsIdentifier = Roles.getRolesListCellsIdentifier();
    await uiHelper.verifyCellsInTable(allCellsIdentifier);
  });

  test("View details of a role", async ({ page }) => {
    const uiHelper = new UIhelper(page);
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

    await uiHelper.clickLink("RBAC");
  });

  test("Create and edit a role from the roles list page", async ({ page }) => {
    const uiHelper = new UIhelper(page);
    const rolesHelper = new Roles(page);

    await rolesHelper.createRole("test-role");
    await page.click(RoleListPO.editRole("role:default/test-role"));
    await uiHelper.verifyHeading("Edit Role");
    await uiHelper.clickButton("Next");
    await page.fill(RoleFormPO.addUsersAndGroups, "Jonathon Page");
    await page.click(RoleFormPO.selectMember("Jonathon Page"));
    await uiHelper.verifyHeading("Users and groups (3 users, 1 group)");
    await uiHelper.clickButton("Next");
    await uiHelper.clickButton("Next");
    await uiHelper.clickButton("Save");
    await uiHelper.verifyText(
      "Role role:default/test-role updated successfully",
    );

    await page.locator(HomePagePO.searchBar).waitFor({ state: "visible" });
    await page.locator(HomePagePO.searchBar).fill("test-role");
    await uiHelper.verifyHeading("All roles (1)");
    const usersAndGroupsLocator = page
      .locator(UIhelperPO.MuiTableCell)
      .filter({ hasText: "3 users, 1 group" });
    await usersAndGroupsLocator.waitFor();
    await expect(usersAndGroupsLocator).toBeVisible();

    await rolesHelper.deleteRole("role:default/test-role");
  });

  test("Edit users and groups and update policies of a role from the overview page", async ({
    page,
  }) => {
    const uiHelper = new UIhelper(page);
    const rolesHelper = new Roles(page);
    await rolesHelper.createRole("test-role1");
    await uiHelper.clickLink("role:default/test-role1");

    await uiHelper.verifyHeading("role:default/test-role1");
    await uiHelper.clickTab("Overview");

    await page.click(RoleOverviewPO.updateMembers);
    await uiHelper.verifyHeading("Edit Role");
    await page.locator(HomePagePO.searchBar).fill("Guest User");
    await page.click('button[aria-label="Remove"]');
    await uiHelper.verifyHeading("Users and groups (1 user, 1 group)");
    await uiHelper.clickButton("Next");
    await uiHelper.clickButton("Next");
    await uiHelper.clickButton("Save");
    await uiHelper.verifyText(
      "Role role:default/test-role1 updated successfully",
    );
    await uiHelper.verifyHeading("Users and groups (1 user, 1 group)");

    await page.click(RoleOverviewPO.updatePolicies);
    await uiHelper.verifyHeading("Edit Role");
    await page.click(RoleFormPO.addPermissionPolicy);
    await page.click(RoleFormPO.selectPermissionPolicyPlugin(1), {
      timeout: 100000,
    });
    await uiHelper.optionSelector("scaffolder");
    await page.click(RoleFormPO.selectPermissionPolicyPermission(1));
    await uiHelper.optionSelector("scaffolder-template");
    await uiHelper.clickButton("Next");
    await uiHelper.clickButton("Save");
    await uiHelper.verifyText(
      "Role role:default/test-role1 updated successfully",
    );
    await uiHelper.verifyHeading("Permission Policies (3)");

    await rolesHelper.deleteRole("role:default/test-role1");
  });

  test("Create a role with a permission policy per resource type and verify that the only authorized users can access specific resources.", async ({
    page,
  }) => {
    const uiHelper = new UIhelper(page);
    const rolesHelper = new Roles(page);
    await rolesHelper.createRoleWithPermissionPolicy("test-role");

    await page.locator(HomePagePO.searchBar).waitFor({ state: "visible" });
    await page.locator(HomePagePO.searchBar).fill("test-role");
    await uiHelper.verifyHeading("All roles (1)");
    await rolesHelper.deleteRole("role:default/test-role");
  });

  //FIXME
  test.fixme(
    "Admin cannot create a role if there are no rules defined for the selected resource type.",
    async ({ page }) => {
      const uiHelper = new UIhelper(page);
      await uiHelper.clickButton("Create");
      await uiHelper.verifyHeading("Create role");

      await page.fill(RoleFormPO.roleName, "test-role");
      await uiHelper.clickButton("Next");
      await page.fill(RoleFormPO.addUsersAndGroups, "guest user");
      await page.click(RoleFormPO.selectMember("Guest User"));
      await uiHelper.clickButton("Next");

      await page.click(RoleFormPO.selectPermissionPolicyPlugin(0), {
        timeout: 100000,
      });
      await uiHelper.optionSelector("catalog");

      await page.click(RoleFormPO.selectPermissionPolicyPermission(0), {
        timeout: 100000,
      });
      await uiHelper.optionSelector("catalog.entity.create");

      await expect(page.getByLabel("configure-access")).not.toBeVisible();
      await uiHelper.clickButton("Cancel");
    },
  );

  test.fixme(
    "As an RHDH admin, I want to be able to restrict access by using the Not condition to part of the plugin, so that some information is protected from unauthorized access.",
    async ({ page }) => {
      const uiHelper = new UIhelper(page);
      const rolesHelper = new Roles(page);
      await rolesHelper.createRoleWithNotPermissionPolicy("test-role");
      await page.locator(HomePagePO.searchBar).waitFor({ state: "visible" });
      await page.locator(HomePagePO.searchBar).fill("test-role");
      await uiHelper.verifyHeading("All roles (1)");

      await rolesHelper.deleteRole("role:default/test-role");
    },
  );

  test.fixme(
    "As an RHDH admin, I want to be able to edit the access rule, so I can keep it up to date and be able to add more plugins in the future.",
    async ({ page }) => {
      const uiHelper = new UIhelper(page);
      const rolesHelper = new Roles(page);
      await rolesHelper.createRoleWithNotPermissionPolicy("test-role");
      await page.locator(HomePagePO.searchBar).waitFor({ state: "visible" });
      await page.locator(HomePagePO.searchBar).fill("test-role");
      await uiHelper.verifyHeading("All roles (1)");

      await page.click(RoleListPO.editRole("role:default/test-role"));
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
        "Role role:default/test-role updated successfully",
      );

      await rolesHelper.deleteRole("role:default/test-role");
    },
  );

  test.fixme(
    "As an RHDH admin, I want to be able to remove an access rule from an existing permission policy.",
    async ({ page }) => {
      const uiHelper = new UIhelper(page);
      const rolesHelper = new Roles(page);
      await rolesHelper.createRoleWithPermissionPolicy("test-role");
      await page.locator(HomePagePO.searchBar).waitFor({ state: "visible" });
      await page.locator(HomePagePO.searchBar).fill("test-role");
      await uiHelper.verifyHeading("All roles (1)");

      await page.click(RoleListPO.editRole("role:default/test-role"));
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
        "Role role:default/test-role updated successfully",
      );

      await rolesHelper.deleteRole("role:default/test-role");
    },
  );
});

test.describe("Test RBAC plugin as a guest user", () => {
  test("Check if Administration side nav is present with no RBAC plugin", async ({
    page,
  }) => {
    const uiHelper = new UIhelper(page);
    await new Common(page).loginAsGuest();
    await uiHelper.openSidebarButton("Administration");
    const dropdownMenuLocator = page.locator(`text="RBAC"`);
    await expect(dropdownMenuLocator).not.toBeVisible();
  });
});
