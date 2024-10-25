import { test } from "@playwright/test";
import { UIhelper } from "../utils/UIhelper";
import { Common } from "../utils/Common";

test.describe("Verify TLS configuration with external Postgres DB", () => {
  test("Verify successful DB connection and display of expected entities in the Catalog", async ({
    page,
    context,
  }) => {
    const uiHelper = new UIhelper(page);
    await Common.logintoGithub(context);
    await uiHelper.openSidebar("Catalog");
    await uiHelper.selectMuiBox("Kind", "Component");
    await uiHelper.clickByDataTestId("user-picker-all");
    await uiHelper.verifyRowsInTable(["Backstage Showcase"]);
  });
});
