import { Page, expect, test } from "@playwright/test";
import { Roles } from "../../../support/pages/rbac";
import { Common } from "../../../utils/common";
import { UIhelper } from "../../../utils/ui-helper";
import fs from "fs/promises";

type RbacPluginFixture = {
  uiHelper: UIhelper;
};

const base = test.extend<RbacPluginFixture>({
  //prettier-ignore
  uiHelper: async ({page}, use) => { //NOSONAR
    const uiHelper = new UIhelper(page);
    await new Common(page).loginAsKeycloakUser();
    await page.goto("/rbac");
    await use(uiHelper);
  },
});

base.describe(
  "Test RBAC plugin: load permission policies and conditions from files",
  () => {
    base.beforeEach(async ({ page }) => {
      await new Common(page).loginAsKeycloakUser();
      await page.goto("/rbac");
    });

    base("Should download the user list", async ({ page }) => {
      await page.locator('a:has-text("Download User List")').click();
      const fileContent = await downloadAndReadFile(page);
      const lines = fileContent.trim().split("\n");

      const header = "userEntityRef,displayName,email,lastAuthTime";
      if (lines[0] !== header) {
        throw new Error("Header does not match");
      }

      // Check that each subsequent line starts with "user:default"
      const allUsersValid = lines
        .slice(1)
        .every((line) => line.startsWith("user:default"));
      if (!allUsersValid) {
        throw new Error("Not all users info are valid");
      }
    });

    async function downloadAndReadFile(
      page: Page,
    ): Promise<string | undefined> {
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.locator('a:has-text("Download User List")').click(),
      ]);

      const filePath = await download.path();

      if (filePath) {
        const fileContent = await fs.readFile(filePath, "utf-8");
        return fileContent;
      } else {
        console.error("Download failed or path is not available");
        return undefined;
      }
    }

    base(
      "Check if permission policies defined in files are loaded and effective",
      async ({ page, uiHelper }) => {
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
      },
    );
  },
);

const baseUser2 = test.extend<RbacPluginFixture>({
  //prettier-ignore
  uiHelper: async ({page}, use) => { //NOSONAR
    const uiHelper = new UIhelper(page);
    await new Common(page).loginAsKeycloakUser(  process.env.GH_USER2_ID,
      process.env.GH_USER2_PASS,);
    await page.goto("/rbac");
    await use(uiHelper);
  },
});

baseUser2.describe(
  "Test RBAC plugin: Aliases used in conditional access policies",
  () => {
    baseUser2(
      "Check if aliases used in conditions: the user is allowed to unregister only components they own, not those owned by the group.",
      async ({ uiHelper, page }) => {
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
        await page
          .getByRole("link", { name: "test-rhdh-qe-2-team-owned" })
          .click();
        await expect(page.locator("header")).toContainText(
          "janus-qe/rhdh-qe-2-team",
        );
        await page.getByTestId("menu-button").click();
        const unregisterGroupOwned = page.getByText("Unregister entity");
        await expect(unregisterGroupOwned).toBeDisabled();
      },
    );
  },
);
