import { Common } from "../utils/Common";
import { SidebarOptions } from "../support/pages/sidebar";
import test from "@playwright/test";
import { sidebarExtendedTest } from "../support/extensions/sidebar-extend";

test.describe("TechDocs", () => {
  let common: Common;

  test.beforeEach(async ({ page }) => {
    common = new Common(page);
    await common.loginAsGuest();
  });

  sidebarExtendedTest(
    "Verify that TechDocs is visible in sidebar",
    async ({ sidebar }) => {
      await sidebar.open(SidebarOptions.Favorites);
      await sidebar.open(SidebarOptions.Docs);
    },
  );

  sidebarExtendedTest(
    "Verify that TechDocs for Backstage Showcase works",
    async ({ page, sidebar }) => {
      await sidebar.open(SidebarOptions.Favorites);
      await sidebar.open(SidebarOptions.Docs);
      await page.getByRole("link", { name: "Backstage Showcase" }).click();
    },
  );
});
