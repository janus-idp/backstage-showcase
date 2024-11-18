import { test, expect } from "@playwright/test";
import { Common } from "../../utils/Common";
import { kubeCLient } from "../../utils/k8sHelper";

test.describe("Change app-config at e2e test runtime", () => {
  test("Verify title change after ConfigMap modification", async ({ page }) => {
    test.setTimeout(300000); // Increasing to 5 minutes

    const configMapName = "app-config-rhdh";
    const namespace = "showcase";
    const deploymentName = "rhdh-backstage";

    // Initialize Kubernetes API
    const kubeUtils = new kubeCLient();
    const dynamicTitle = generateDynamicTitle();

    // Updates the ConfigMap
    await kubeUtils.updateConfigMapTitle(
      configMapName,
      namespace,
      dynamicTitle,
    );

    // Restarts the deployment and ensures it scales correctly
    await kubeUtils.restartDeployment(deploymentName, namespace);

    // Checks the title in the frontend after the restart
    await new Common(page).loginAsGuest();
    console.log("Checking the title: ", dynamicTitle);
    expect(await page.title()).toContain(dynamicTitle);
  });
});

function generateDynamicTitle() {
  const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
  return `New Title - ${timestamp}`;
}
