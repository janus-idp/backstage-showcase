import { test } from "@playwright/test";
import { UIhelper } from "../utils/UIhelper";
import { Common } from "../utils/Common";
import { GH_USER_IDAuthFile } from "../support/auth/auth_constants";

test.use({ storageState: GH_USER_IDAuthFile });
test.describe.serial("GitHub integration with Org data fetching", () => {
  let uiHelper: UIhelper;
  test.beforeEach(async ({ page }) => {
    uiHelper = new UIhelper(page);
    await new Common(page).logintoGithub();
    await uiHelper.openSidebar("Catalog");
  });

  test("Verify that fetching the groups of the first org works", async () => {
    await uiHelper.selectMuiBox("Kind", "Group");

    await uiHelper.searchInputPlaceholder("m");
    await uiHelper.verifyRowsInTable(["maintainers"]);

    await uiHelper.searchInputPlaceholder("r");
    await uiHelper.verifyRowsInTable(["rhdh-qes"]);
  });

  test("Verify that fetching the groups of the second org works", async () => {
    await uiHelper.searchInputPlaceholder("c");
    await uiHelper.verifyRowsInTable(["catalog-group"]);

    await uiHelper.searchInputPlaceholder("j");
    await uiHelper.verifyRowsInTable(["janus-test"]);
  });

  test("Verify that fetching the users of the orgs works", async () => {
    await uiHelper.selectMuiBox("Kind", "User");

    await uiHelper.searchInputPlaceholder("r");
    await uiHelper.verifyRowsInTable(["rhdh-qe"]);
  });
});
