import { test, expect } from "@playwright/test";
import { UIhelper } from "../utils/ui-helper";
import { Common } from "../utils/common";

test.describe("Verify TLS configuration with external Postgres DB", () => {
  test("Verify successful DB connection and display of expected entities in the Home Page and Catalog", async ({
    page,
  }) => {
    const uiHelper = new UIhelper(page);
    const common = new Common(page);
    await common.loginAsKeycloakUser();
    await uiHelper.verifyHeading("Welcome back!");
    await uiHelper.verifyText("Quick Access");
    await page.getByLabel("Catalog").click();
    await uiHelper.selectMuiBox("Kind", "Component");
    await expect(async () => {
      await uiHelper.clickByDataTestId("user-picker-all");
      await uiHelper.verifyRowsInTable(["test-rhdh-qe-2-team-owned"]);
    }).toPass({
      intervals: [1_000, 2_000],
      timeout: 15_000,
    });
  });
});
