import { test, expect } from "@playwright/test";
import { Common } from "../../../utils/Common";
import { UIhelper } from "../../../utils/UIhelper";
import { UIhelperPO } from "../../../support/pageObjects/global-obj";
import { GH_USER_IDAuthFile_rhdh } from "../../../support/auth/auth_constants";

test.describe('Check RBAC "analytics-provider-segment" plugin', () => {
  test.use({ storageState: GH_USER_IDAuthFile_rhdh });
  let uiHelper: UIhelper;

  test.beforeEach(async ({ page }) => {
    uiHelper = new UIhelper(page);
    await new Common(page).logintoGithub();
    await uiHelper.openSidebarButton("Administration");
    await uiHelper.openSidebar("Plugins");
    await uiHelper.verifyHeading("Plugins");
  });

  test("is disabled", async ({ page }) => {
    await page
      .getByPlaceholder("Filter")
      .pressSequentially("backstage-plugin-analytics-provider-segment\n", {
        delay: 300,
      });
    const row = page.locator(
      UIhelperPO.rowByText(
        "@janus-idp/backstage-plugin-analytics-provider-segment",
      ),
    );
    expect(await row.locator("td").nth(2).innerText()).toBe("No"); // not enabled
  });
});
