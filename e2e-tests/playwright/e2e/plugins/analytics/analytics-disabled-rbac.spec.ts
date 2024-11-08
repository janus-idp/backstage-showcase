import test, { expect } from "@playwright/test";
import { Common } from "../../../utils/Common";
import { UIhelper } from "../../../utils/UIhelper";
import { UIhelperPO } from "../../../support/pageObjects/global-obj";
import { SidebarOptions } from "../../../support/pages/sidebar";
import { sidebarExtendedTest } from "../../../support/extensions/sidebar-extend";

test.describe('Check RBAC "analytics-provider-segment" plugin', () => {
  let common: Common;
  let uiHelper: UIhelper;

  sidebarExtendedTest.beforeEach(async ({ page, sidebar }) => {
    uiHelper = new UIhelper(page);
    common = new Common(page);
    await common.loginAsGithubUser();
    await sidebar.open(SidebarOptions.Administration);
    await sidebar.open(SidebarOptions.Plugins);
    await uiHelper.verifyHeading("Plugins");
  });

  test.beforeEach(
    async ({ page }) => await new Common(page).checkAndClickOnGHloginPopup(),
  );

  test("is disabled", async ({ page }) => {
    await page
      .getByPlaceholder("Filter")
      .pressSequentially("backstage-plugin-analytics-provider-segment\n", {
        delay: 300,
      });
    const row = page.locator(
      UIhelperPO.rowByText(
        "janus-idp-backstage-plugin-analytics-provider-segment",
      ),
    );
    expect(await row.locator("td").nth(2).innerText()).toBe("No"); // not enabled
  });
});
