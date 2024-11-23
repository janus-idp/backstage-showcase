import { test, expect } from "@playwright/test";
import { Common } from "../../utils/Common";
import { kubeCLient } from "../../utils/k8sHelper";
import {logger} from "../../utils/Logger";

test.describe("Change app-config at e2e test runtime", () => {
  test("Verify title change after ConfigMap modification", async ({ page }) => {
    test.setTimeout(300000); // Increasing to 5 minutes

    const configMapName = "app-config-rhdh";
    const namespace = "showcase-runtime";
    const deploymentName = "rhdh-backstage";

    const kubeUtils = new kubeCLient();
    const dynamicTitle = generateDynamicTitle();

    try {
      logger.info(`Updating ConfigMap '${configMapName}' with new title.`);
      await kubeUtils.updateConfigMapTitle(
          configMapName,
          namespace,
          dynamicTitle,
      );

      logger.info(
          `Restarting deployment '${deploymentName}' to apply ConfigMap changes.`,
      );
      await kubeUtils.restartDeployment(deploymentName, namespace);

      const common = new Common(page);
      await common.loginAsGuest();
      logger.info("Verifying new title in the UI...");
      expect(await page.title()).toContain(dynamicTitle);
      logger.info("Title successfully verified in the UI.");
    } catch (error) {
      logger.error(
          `Test failed during ConfigMap update or deployment restart:`,
          error,
      );
      throw error;
    }
  });

});

function generateDynamicTitle() {
  const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
  return `New Title - ${timestamp}`;
}
