import { test, expect } from '@playwright/test';
import { Common } from '../../utils/Common';
import { KubernetesUtils } from '../../utils/k8s/KubernetesUtils';

test.describe('Change app-config at e2e test runtime', () => {
  test('Verify title change after ConfigMap modification', async ({ page }) => {
    test.setTimeout(120000);

    const configMapName = 'app-config-rhdh';
    const namespace = process.env.NAME_SPACE;
    const deploymentName = 'rhdh-backstage';

    // Initialize Kubernetes API
    const kubeUtils = new KubernetesUtils();

    const dynamicTitle = generateDynamicTitle();

    await kubeUtils.updateConfigMapTitle(
      configMapName,
      namespace,
      dynamicTitle,
    );
    await kubeUtils.restartDeployment(deploymentName, namespace);

    await new Common(page).loginAsGuest();
    console.log('Checking the title: ', dynamicTitle);
    expect(await page.title()).toContain(dynamicTitle);
  });
});

function generateDynamicTitle() {
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
  return `New Title - ${timestamp}`;
}
