import { test } from "@playwright/test";
import { execSync } from "child_process";
import { Common, setupBrowser } from "../../../utils/common";
import { UIhelper } from "../../../utils/ui-helper";

test.describe("Test Kubernetes Actions plugin", () => {
  let common: Common;
  let uiHelper: UIhelper;

  test.beforeAll(async ({ browser }, testInfo) => {
    const page = (await setupBrowser(browser, testInfo)).page;
    common = new Common(page);
    uiHelper = new UIhelper(page);

    await common.loginAsGuest();
    await uiHelper.openSidebar("Create...");
  });

  test("Creates kubernetes namespace", async () => {
    const newNamespace = "test-namespace";
    await uiHelper.verifyHeading("Software Templates");
    await uiHelper.clickBtnInCard("Create a kubernetes namespace", "Choose");
    await uiHelper.waitForTitle("Create a kubernetes namespace", 2);

    await uiHelper.fillTextInputByLabel("Namespace name", newNamespace);
    await uiHelper.fillTextInputByLabel("Url", process.env.K8S_CLUSTER_URL);
    await uiHelper.fillTextInputByLabel("Token", process.env.K8S_CLUSTER_TOKEN);
    await uiHelper.clickButton("Review");
    await uiHelper.clickButton("Create");

    try {
      execSync(
        `oc login --token="${process.env.K8S_CLUSTER_TOKEN}" --server="${process.env.K8S_CLUSTER_URL}"`,
      );
    } catch (error) {
      throw new Error("Unable to login to Kubernetes cluster");
    }

    try {
      execSync(`oc get namespace ${newNamespace}`);
    } catch (error) {
      throw new Error("Namespace not created");
    }

    try {
      execSync(`oc delete namespace ${newNamespace}`);
    } catch (error) {
      throw new Error("Unable to clean up namespace");
    }
  });
});
