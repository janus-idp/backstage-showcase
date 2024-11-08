import test, { expect } from "@playwright/test";
import { UIhelper } from "../../../utils/UIhelper";
import { Common } from "../../../utils/Common";
import { UIhelperPO } from "../../../support/pageObjects/global-obj";
import { SidebarOptions } from "../../../support/pages/sidebar";
import { sidebarExtendedTest } from "../../../support/extensions/sidebar-extend";

test.describe("dynamic-plugins-info UI tests", () => {
  let uiHelper: UIhelper;
  let common: Common;

  sidebarExtendedTest.beforeEach(async ({ page, sidebar }) => {
    uiHelper = new UIhelper(page);
    common = new Common(page);
    await common.loginAsGuest();
    await sidebar.open(SidebarOptions.Administration);
    await sidebar.open(SidebarOptions.Plugins);
    await uiHelper.verifyHeading("Plugins");
  });

  test("it should show a table, and the table should contain techdocs plugins", async ({
    page,
  }) => {
    // what shows up in the list depends on how the instance is configured so
    // let's check for the main basic elements of the component to verify the
    // mount point is working as expected
    await uiHelper.verifyText(/Plugins \(\d+\)/);
    await uiHelper.verifyText("5 rows", false);
    await uiHelper.verifyColumnHeading(
      ["Name", "Version", "Enabled", "Preinstalled", "Role"],
      true,
    );

    // Check the filter and use that to verify that the table contains the
    // dynamic-plugins-info plugin, which is required for this test to run
    // properly anyways
    await page
      .getByPlaceholder("Filter")
      .pressSequentially("techdocs\n", { delay: 300 });
    await uiHelper.verifyRowsInTable(["backstage-plugin-techdocs"], true);
  });

  test.skip("it should have a backstage-plugin-tech-radar plugin which is Enabled and Preinstalled", async ({
    page,
  }) => {
    await page
      .getByPlaceholder("Filter")
      .pressSequentially("backstage-plugin-tech-radar\n", { delay: 300 });
    const row = page.locator(
      UIhelperPO.rowByText("backstage-plugin-tech-radar"),
    );
    expect(await row.locator("td").nth(2).innerText()).toBe("Yes"); // enabled
    expect(await row.locator("td").nth(3).innerText()).toBe("Yes"); // preinstalled
  });

  test("it should have a plugin-3scale-backend plugin which is not Enabled but Preinstalled", async ({
    page,
  }) => {
    await page
      .getByPlaceholder("Filter")
      .pressSequentially("plugin-3scale-backend-dynamic\n", {
        delay: 300,
      });
    const row = page.locator(
      UIhelperPO.rowByText("backstage-community-plugin-3scale-backend-dynamic"),
    );
    expect(await row.locator("td").nth(2).innerText()).toBe("No"); // not enabled
    expect(await row.locator("td").nth(3).innerText()).toBe("Yes"); // preinstalled
  });

  // TODO: Add plugin-todo-list plugin in ci process to enable this test
  test.skip("it should have a plugin-todo-list plugin which is Enabled but not Preinstalled", async ({
    page,
  }) => {
    await page
      .getByPlaceholder("Filter")
      .pressSequentially("plugin-todo-list\n", { delay: 300 });
    const row = page.locator(
      UIhelperPO.rowByText("@internal/plugin-todo-list"),
    );
    expect(await row.locator("td").nth(2).innerText()).toBe("Yes"); // enabled
    expect(await row.locator("td").nth(3).innerText()).toBe("No"); // not preinstalled
  });
});
