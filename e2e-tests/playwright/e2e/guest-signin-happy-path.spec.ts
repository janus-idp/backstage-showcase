import { test as base } from "@playwright/test";
import { HomePage } from "../support/pages/HomePage";
import { Common } from "../utils/Common";
import { UIhelper } from "../utils/UIhelper";

const test = base.extend<{ uiHelper: UIhelper }>({
  uiHelper: async ({ page }, use) => {
    const uiHelper = new UIhelper(page);
    await use(uiHelper);
  },
});

test.describe("Guest Signing Happy path", () => {
  let homePage: HomePage;
  let common: Common;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    common = new Common(page);
    await common.loginAsGuest();
  });

  test("Verify the Homepage renders with Search Bar, Quick Access and Starred Entities", async ({
    uiHelper,
  }) => {
    await uiHelper.verifyHeading("Welcome back!");
    await uiHelper.openSidebar("Home");
    await homePage.verifyQuickAccess("Developer Tools", "Podman Desktop");
  });

  test("Verify Profile is Guest in the Settings page", async ({ uiHelper }) => {
    await uiHelper.openSidebar("Settings");
    await uiHelper.verifyHeading("Guest");
    await uiHelper.verifyHeading("User Entity: guest");
  });

  //  test("Sign Out and Verify that you return to the Sign-in page", async () => {
  //    await uiHelper.openSidebar("Settings");
  //    await common.signOut();
  //  });
});
