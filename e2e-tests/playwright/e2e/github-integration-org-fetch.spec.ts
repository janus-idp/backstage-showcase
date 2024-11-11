import { test, Page } from "@playwright/test";
import { UIhelper } from "../utils/UIhelper";
import { setupBrowser } from "../utils/Common";
import githubTest from "../utils/test-extensions/github-test";

let page: Page;
githubTest().describe.serial(
  "GitHub integration with Org data fetching",
  () => {
    let uiHelper: UIhelper;

    test.beforeAll(async ({ browser }, testInfo) => {
      page = (await setupBrowser(browser, testInfo)).page;
      uiHelper = new UIhelper(page);
    });

    test("Verify that fetching the groups of the first org works", async () => {
      await uiHelper.openSidebar("Catalog");
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
      await uiHelper.openSidebar("Catalog");
      await uiHelper.selectMuiBox("Kind", "User");

      await uiHelper.searchInputPlaceholder("r");
      await uiHelper.verifyRowsInTable(["rhdh-qe"]);
    });
  },
);
