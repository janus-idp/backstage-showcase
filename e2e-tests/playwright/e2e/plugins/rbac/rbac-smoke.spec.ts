import test from "@playwright/test";
import { Common } from "../../../utils/common";
import { UIhelper } from "../../../utils/ui-helper";

test("Check RBAC is displayed on frontend", async ({ page }) => {
  await new Common(page).loginAsGithubUser();
  const helper = new UIhelper(page);
  await helper.waitForSideBarVisible();
  await helper.openSidebarButton("RBAC");
});
