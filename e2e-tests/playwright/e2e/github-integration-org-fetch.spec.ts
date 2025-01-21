import { test as base } from "@playwright/test";
import { UIhelper } from "../utils/ui-helper";
import { Common } from "../utils/common";

const test = base.extend<{
  uiHelper: UIhelper;
}>({
  uiHelper: async ({ page }, use) => {
    await new Common(page).loginAsKeycloakUser();
    const uiHelper = new UIhelper(page);
    await page.goto("/catalog");
    await use(uiHelper);
  },
});

test.describe.serial("GitHub integration with Org data fetching", () => {
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
