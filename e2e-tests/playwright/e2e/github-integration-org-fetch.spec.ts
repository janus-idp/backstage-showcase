import { test as base } from "@playwright/test";
import { UIhelper } from "../utils/ui-helper";
import { Common } from "../utils/common";

const test = base.extend<{
  common: Common;
  uiHelper: UIhelper;
}>({
  common: async ({ page }, use) => {
    const common = new Common(page);
    await common.loginAsKeycloakUser();
    await use(common);
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  uiHelper: async ({ page, common }, use) => {
    const uiHelper = new UIhelper(page);
    await uiHelper.openSidebar("Catalog");
    await use(uiHelper);
  },
});

test.describe("GitHub integration with Org data fetching", () => {
  test("Verify that fetching the groups of the first org works", async ({
    uiHelper,
  }) => {
    await uiHelper.selectMuiBox("Kind", "Group");
    await uiHelper.searchInputPlaceholder("maintainers");
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
