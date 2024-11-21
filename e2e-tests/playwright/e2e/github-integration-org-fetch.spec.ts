import { UIhelper } from "../utils/UIhelper";
import { Common } from "../utils/Common";
import { GH_USER_IDAuthFile } from "../support/auth/auth_constants";
import { test as base } from "@playwright/test";

const test = base.extend<{ uiHelper: UIhelper }>({
  uiHelper: async ({ page }, use) => {
    const uiHelper = new UIhelper(page);
    await new Common(page).logintoGithub();
    await uiHelper.openSidebar("Catalog");
    await use(uiHelper);
  },
});

test.use({ storageState: GH_USER_IDAuthFile });
test.describe("GitHub integration with Org data fetching", () => {
  test("Verify that fetching the groups of the first org works", async ({
    uiHelper,
  }) => {
    await uiHelper.selectMuiBox("Kind", "Group");

    await uiHelper.searchInputPlaceholder("m");
    await uiHelper.verifyRowsInTable(["maintainers"]);

    await uiHelper.searchInputPlaceholder("r");
    await uiHelper.verifyRowsInTable(["rhdh-qes"]);
  });

  test("Verify that fetching the groups of the second org works", async ({
    uiHelper,
  }) => {
    await uiHelper.searchInputPlaceholder("c");
    await uiHelper.verifyRowsInTable(["catalog-group"]);

    await uiHelper.searchInputPlaceholder("j");
    await uiHelper.verifyRowsInTable(["janus-test"]);
  });

  test("Verify that fetching the users of the orgs works", async ({
    uiHelper,
  }) => {
    await uiHelper.selectMuiBox("Kind", "User");
    await uiHelper.searchInputPlaceholder("r");
    await uiHelper.verifyRowsInTable(["rhdh-qe"]);
  });
});
