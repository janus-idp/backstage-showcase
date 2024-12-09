import { test, expect } from "@playwright/test";
import { Common } from "../../../utils/common";
import { UIhelper } from "../../../utils/ui-helper";
import { Catalog } from "../../../support/pages/catalog";

// Test disabled due to comments in JIRA ticket RHIDP-3437
test.describe.skip("Test Topology Plugin", () => {
  let common: Common;
  let uiHelper: UIhelper;
  let catalog: Catalog;

  test.beforeEach(async ({ page }) => {
    common = new Common(page);
    uiHelper = new UIhelper(page);
    catalog = new Catalog(page);
    await common.loginAsGuest();
  });

  test("Verify pods visibility in the Topology tab", async ({ page }) => {
    test.setTimeout(40000);
    await catalog.goToBackstageJanusProject();
    await uiHelper.clickTab("Topology");
    await uiHelper.verifyText("backstage-janus");
    await page.getByRole("button", { name: "Fit to Screen" }).click();
    await uiHelper.verifyText("rhdh");
    await uiHelper.verifyText("rhdh-rbac");
    await uiHelper.verifyButtonURL(
      "Open URL",
      "https://rhdh-backstage-showcase",
    );
    await page.locator("image").first().click();
    await page.getByLabel("Pod").click();
    await page.getByLabel("Pod").getByText("1", { exact: true }).click();
    await uiHelper.clickTab("Details");
    await uiHelper.verifyText("Status");
    await uiHelper.verifyText("Active");
    await uiHelper.clickTab("Resources");
    await uiHelper.verifyHeading("Pods");
    await uiHelper.verifyHeading("Services");
    await uiHelper.verifyHeading("Routes");
    await expect(
      page.getByRole("link", { name: "https://rhdh-backstage-" }),
    ).toBeVisible();
    await expect(page.getByTitle("Deployment")).toBeVisible();
    await uiHelper.verifyText("S");
    await uiHelper.verifyText("RT");
    await expect(page.locator("rect").first()).toBeVisible();
    await uiHelper.clickTab("Details");
    await page.getByLabel("Pod").hover();
    await page.getByLabel("Display options").click();
    await page.getByLabel("Pod count").click();
    await uiHelper.verifyText("1");
    await uiHelper.verifyText("Pod");
    await page.getByLabel("Pod count").click();
  });
});
