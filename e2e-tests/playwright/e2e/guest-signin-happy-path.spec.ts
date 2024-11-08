import { test as base } from "@playwright/test";
import { UIhelper } from "../utils/UIhelper";
import { HomePage } from "../support/pages/HomePage";
import { Common } from "../utils/Common";
import { Sidebar, SidebarOptions } from "../support/pages/sidebar";

const test = base.extend<{ sidebar: Sidebar }>({
  sidebar: async ({ page }, use) => {
    const sidebar = new Sidebar(page);
    await use(sidebar);
  },
});

test.describe("Guest Signing Happy path", () => {
  let uiHelper: UIhelper;
  let homePage: HomePage;
  let common: Common;

  test.beforeEach(async ({ page }) => {
    uiHelper = new UIhelper(page);
    homePage = new HomePage(page);
    common = new Common(page);
    await common.loginAsGuest();
  });

  test("Verify the Homepage renders with Search Bar, Quick Access and Starred Entities", async ({
    sidebar,
  }) => {
    await uiHelper.verifyHeading("Welcome back!");
    await sidebar.open(SidebarOptions.Home);
    await homePage.verifyQuickAccess("Developer Tools", "Podman Desktop");
  });

  test("Verify Profile is Guest in the Settings page", async ({ sidebar }) => {
    await sidebar.open(SidebarOptions.Settings);
    await uiHelper.verifyHeading("Guest");
    await uiHelper.verifyHeading("User Entity: guest");
  });

  test("Sign Out and Verify that you return to the Sign-in page", async ({
    sidebar,
  }) => {
    await sidebar.open(SidebarOptions.Settings);
    await common.signOut();
  });
});
