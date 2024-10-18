import { Page, test } from '@playwright/test';
import { Common, setupBrowser } from '../../../../playwright/utils/Common';
import { UIhelper } from '../../../../playwright/utils/UIhelper';
import { exec } from 'child_process';

test.describe('Test Kubernetes Actions plugin', () => {
  let common: Common;
  let uiHelper: UIhelper;
  let page: Page;

  test.beforeAll(async ({ browser }, testInfo) => {
    page = (await setupBrowser(browser, testInfo)).page;
    common = new Common(page);
    await common.loginAsGuest();
    uiHelper = new UIhelper(page);
    await uiHelper.openSidebar('Create...');
  });

  test('Creates kubernetes namespace', async () => {
    const newNamespace = 'test-namespace';

    await uiHelper.verifyHeading('Software Templates');
    await uiHelper.clickBtnInCard('Create a kubernetes namespace', 'Choose');
    await uiHelper.waitForTitle('Create a kubernetes namespace', 2);

    await page.getByLabel('Namespace name').fill(newNamespace);
    await page.getByLabel('Url').fill(process.env.K8S_CLUSTER_URL);
    await page.getByLabel('Token').fill(process.env.K8S_CLUSTER_TOKEN);
    await page.getByRole('button', { name: 'Review' }).click();
    await page.getByRole('button', { name: 'Create' }).click();

    exec(
      `oc login --token="${process.env.K8S_CLUSTER_TOKEN}" --server="${process.env.K8S_CLUSTER_URL}"`,
      error => {
        if (error) {
          throw new Error('Unable to login to Kubernetes cluster');
        }
      },
    );

    exec(`oc get namespace ${newNamespace}`, error => {
      if (error) {
        throw new Error('Namespace not created');
      }
    });

    exec(`oc delete namespace ${newNamespace}`, error => {
      if (error) {
        throw new Error('Unable to clean up namespace');
      }
    });
  });
});
