import { expect, test as base } from "@playwright/test";
import { Common } from "../utils/Common";
import { Sidebar, SidebarOptions } from "../support/pages/sidebar";

const test = base.extend<{ sidebar: Sidebar }>({
  sidebar: async ({ page }, use) => {
    const sidebar = new Sidebar(page);
    await use(sidebar);
  },
});

test.describe("Learning Paths", () => {
  let common: Common;

  test.beforeEach(async ({ page }) => {
    common = new Common(page);
    await common.loginAsGuest();
  });

  test("Verify that links in Learning Paths for Backstage opens in a new tab", async ({
    page,
    sidebar,
  }) => {
    await sidebar.open(SidebarOptions.References);
    await sidebar.open(SidebarOptions["Learning Paths"]);

    for (let i = 0; i < 5; i++) {
      const learningPathCard = page
        .locator(`div[class*="MuiGrid-item"]>a[target="_blank"]`)
        .nth(i);
      await expect(learningPathCard).toBeVisible();
      expect(await learningPathCard.getAttribute("href")).not.toBe("");
    }
  });
});
