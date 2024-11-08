import { test as base } from "@playwright/test";
import { Common } from "../utils/Common";
import { Sidebar, SidebarOptions } from "../support/pages/sidebar";

const test = base.extend<{ sidebar: Sidebar }>({
  sidebar: async ({ page }, use) => {
    const sidebar = new Sidebar(page);
    await use(sidebar);
  },
});

test.describe("TechDocs", () => {
  let common: Common;

  test.beforeEach(async ({ page }) => {
    common = new Common(page);
    await common.loginAsGuest();
  });

  test("Verify that TechDocs is visible in sidebar", async ({ sidebar }) => {
    await sidebar.open(SidebarOptions.Favorites);
    await sidebar.open(SidebarOptions.Docs);
  });

  test("Verify that TechDocs for Backstage Showcase works", async ({
    page,
    sidebar,
  }) => {
    await sidebar.open(SidebarOptions.Favorites);
    await sidebar.open(SidebarOptions.Docs);
    await page.getByRole("link", { name: "Backstage Showcase" }).click();
  });
});
