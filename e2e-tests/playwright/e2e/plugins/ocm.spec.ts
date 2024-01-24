import { test } from '@playwright/test';
import { Common } from '../../utils/Common';
import { UIhelper } from '../../utils/UIhelper';
import { Clusters } from '../../support/pages/Clusters';

//Pre-req: Enable janus-idp-backstage-plugin-ocm-backend-dynamic and janus-idp-backstage-plugin-ocm Plugins

const clusterDetails = {
  clusterName: 'testCluster',
  status: 'Ready',
  platform: 'IBM',
  cpuCores: '12',
  memorySize: '47 Gi',
  ocVersion: '4.13.23',
};

test.describe.skip('Test OCM plugin', () => {
  test.beforeEach(async ({ page }) => {
    const common = new Common(page);
    await common.loginAsGuest();
  });

  test('Navigate to Clusters and Verify OCM Clusters', async ({ page }) => {
    const uiHelper = new UIhelper(page);
    const clusters = new Clusters(page);

    await uiHelper.openSidebar('Clusters');
    await uiHelper.verifyRowsInTable([
      clusterDetails.clusterName,
      clusterDetails.status,
      clusterDetails.platform,
      clusterDetails.ocVersion,
    ]);
    await uiHelper.clickLink(clusterDetails.clusterName);

    await clusters.verifyOCMLinksCardDetails();
    await clusters.verifyOCMAvailableCardDetails(
      clusterDetails.cpuCores,
      clusterDetails.memorySize,
    );
    await clusters.verifyOCMClusterInfo(
      clusterDetails.clusterName,
      clusterDetails.status,
    );
  });

  test('Navigate to Catalog > resources and verify cluster', async ({
    page,
  }) => {
    const uiHelper = new UIhelper(page);
    const clusters = new Clusters(page);

    await uiHelper.openSidebar('Catalog');
    await uiHelper.selectMuiBox('Kind', 'Resource');
    await uiHelper.verifyRowsInTable([clusterDetails.clusterName]);
    await uiHelper.clickLink(clusterDetails.clusterName);
    await clusters.verifyOCMClusterInfo(
      clusterDetails.clusterName,
      clusterDetails.status,
    );
  });
});
