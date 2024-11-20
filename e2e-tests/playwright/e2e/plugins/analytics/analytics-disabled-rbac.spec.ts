import { Common } from "../../../utils/Common";
import { UIhelper } from "../../../utils/UIhelper";
import { UIhelperPO } from "../../../support/pageObjects/global-obj";
import { GH_USER_IDAuthFile } from "../../../support/auth/auth_constants";
import { test as base, expect } from "@playwright/test";

const test = base.extend<{ uiHelper: UIhelper }>({
  uiHelper: async ({ page }, use) => {
    const uiHelper = new UIhelper(page);
    await use(uiHelper);
  },
});

test.describe('Check RBAC "analytics-provider-segment" plugin', () => {
  test.use({ storageState: GH_USER_IDAuthFile });

  test("is disabled", async ({ uiHelper, page }) => {
    await new Common(page).logintoGithub();
    await uiHelper.openSidebarButton("Administration");
    await uiHelper.openSidebar("Plugins");
    await uiHelper.verifyHeading("Plugins");
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

test("is disabled", async ({ page }) => {
  await page
    .getByPlaceholder("Filter")
    .pressSequentially("backstage-plugin-analytics-provider-segment\n", {
      delay: 300,
    });
  const row = page.locator(
    UIhelperPO.rowByText(
      "backstage-community-plugin-analytics-provider-segment",
    ),
  );
  expect(await row.locator("td").nth(2).innerText()).toBe("No"); // not enabled
});
