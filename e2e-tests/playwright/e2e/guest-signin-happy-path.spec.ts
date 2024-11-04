import { testWithHelper } from "../utils/UIhelper";
import { HomePage } from "../support/pages/HomePage";
import { Common } from "../utils/Common";

testWithHelper.describe("Guest Signing Happy path", () => {
  let homePage: HomePage;
  let common: Common;

  testWithHelper.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    common = new Common(page);
    await common.loginAsGuest();
  });

  testWithHelper(
    "Verify the Homepage renders with Search Bar, Quick Access and Starred Entities",
    async ({ uiHelper }) => {
      await uiHelper.verifyHeading("Welcome back!");
      await uiHelper.openSidebar("Home");
      await homePage.verifyQuickAccess("Developer Tools", "Podman Desktop");
    },
  );

  testWithHelper(
    "Verify Profile is Guest in the Settings page",
    async ({ uiHelper }) => {
      await uiHelper.openSidebar("Settings");
      await uiHelper.verifyHeading("Guest");
      await uiHelper.verifyHeading("User Entity: guest");
    },
  );

  //  test("Sign Out and Verify that you return to the Sign-in page", async () => {
  //    await uiHelper.openSidebar("Settings");
  //    await common.signOut();
  //  });
});
