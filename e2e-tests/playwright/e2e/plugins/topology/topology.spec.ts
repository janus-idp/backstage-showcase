import { test } from "@playwright/test";
import { Common } from "../../../utils/Common";
import { UIhelper } from "../../../utils/UIhelper";
import { Catalog } from "../../../support/pages/Catalog";

test.describe("Test Topology Plugin", () => {
  let common: Common;
  let uiHelper: UIhelper;
  let catalog: Catalog;

  test.beforeEach(async ({ page }) => {
    common = new Common(page);
    uiHelper = new UIhelper(page);
    catalog = new Catalog(page);
    await common.loginAsGuest();
  });

  test("Verify pods visibility in the Topology tab", async () => {
    await catalog.goToBackstageJanusProject();
    await uiHelper.clickTab("Topology");
    await uiHelper.verifyText("backstage-janus");
    await uiHelper.verifyText("rhdh");
    await uiHelper.verifyText("rhdh-rbac");
  });
});
