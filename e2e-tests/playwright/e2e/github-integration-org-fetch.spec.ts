import { testWithHelper } from "../utils/UIhelper";
import { Common } from "../utils/Common";
import { GH_USER_IDAuthFile } from "../support/auth/auth_constants";

testWithHelper.use({ storageState: GH_USER_IDAuthFile });
testWithHelper.describe("GitHub integration with Org data fetching", () => {
  testWithHelper.beforeEach(async ({ uiHelper, page }) => {
    await new Common(page).logintoGithub();
    await uiHelper.openSidebar("Catalog");
  });

  testWithHelper(
    "Verify that fetching the groups of the first org works",
    async ({ uiHelper }) => {
      await uiHelper.selectMuiBox("Kind", "Group");

      await uiHelper.searchInputPlaceholder("m");
      await uiHelper.verifyRowsInTable(["maintainers"]);

      await uiHelper.searchInputPlaceholder("r");
      await uiHelper.verifyRowsInTable(["rhdh-qes"]);
    },
  );

  testWithHelper(
    "Verify that fetching the groups of the second org works",
    async ({ uiHelper }) => {
      await uiHelper.searchInputPlaceholder("c");
      await uiHelper.verifyRowsInTable(["catalog-group"]);

      await uiHelper.searchInputPlaceholder("j");
      await uiHelper.verifyRowsInTable(["janus-test"]);
    },
  );

  testWithHelper(
    "Verify that fetching the users of the orgs works",
    async ({ uiHelper }) => {
      await uiHelper.selectMuiBox("Kind", "User");
      await uiHelper.searchInputPlaceholder("r");
      await uiHelper.verifyRowsInTable(["rhdh-qe"]);
    },
  );
});
