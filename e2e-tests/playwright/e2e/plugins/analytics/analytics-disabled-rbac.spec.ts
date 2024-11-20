import { expect } from "@playwright/test";
import { Common } from "../../../utils/Common";
import { testWithHelper } from "../../../utils/UIhelper";
import { UIhelperPO } from "../../../support/pageObjects/global-obj";
import { GH_USER_IDAuthFile } from "../../../support/auth/auth_constants";

testWithHelper.describe(
  'Check RBAC "analytics-provider-segment" plugin',
  () => {
    testWithHelper.use({ storageState: GH_USER_IDAuthFile });

    testWithHelper("is disabled", async ({ uiHelper, page }) => {
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
  },
);

testWithHelper("is disabled", async ({ page }) => {
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
