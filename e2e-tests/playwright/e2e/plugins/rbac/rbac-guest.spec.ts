import test, { expect } from "@playwright/test";
import { Common } from "../../../utils/common";
import { UIhelper } from "../../../utils/ui-helper";

type RbacGuestFixture = {
  uiHelper: UIhelper;
  common: Common;
};

const base = test.extend<RbacGuestFixture>({
  uiHelper: async ({ page }, use) => {
    const uiHelper = new UIhelper(page);
    use(uiHelper);
  },
  common: async ({ page }, use) => {
    const common = new Common(page);
    use(common);
  },
});

base.describe("Test RBAC plugin as a guest user", () => {
  base.beforeEach(async ({ uiHelper, common }) => {
    await common.loginAsGuest();
    await uiHelper.openSidebarButton("Administration");
  });

  base(
    "Check if Administration side nav is present with no RBAC plugin",
    async ({ page }) => {
      const dropdownMenuLocator = page.locator(`text="RBAC"`);
      await expect(dropdownMenuLocator).not.toBeVisible();
    },
  );
});
