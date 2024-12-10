import { test } from "@playwright/test";
import { UIhelper } from "../utils/ui-helper";
import { Common } from "../utils/common";

test.describe("Verify TLS configuration with external Postgres DB", () => {
  test("Verify successful DB connection and display of expected entities in the Catalog", async ({
    page,
  }) => {
    const uiHelper = new UIhelper(page);
    const common = new Common(page);
    await common.loginAsKeycloakUser();
    await page.goto("/catalog");
    await uiHelper.selectMuiBox("Kind", "Component");
    await uiHelper.clickByDataTestId("user-picker-all");
    await uiHelper.verifyRowsInTable(["Backstage Showcase"]);
  });
});
