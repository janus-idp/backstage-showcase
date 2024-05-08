import { Page, test } from '@playwright/test';
import { Common, setupBrowser } from '../../utils/Common';
import { UIhelper } from '../../utils/UIhelper';
import { Clusters } from '../../support/pages/Clusters';

//Pre-req: Enable janus-idp-backstage-plugin-ocm-backend-dynamic and janus-idp-backstage-plugin-ocm Plugins
//Pre-req: Install Advanced Cluster Management for Kubernetes "MultiClusterHub"
// https://access.redhat.com/documentation/en-us/red_hat_advanced_cluster_management_for_kubernetes/2.10/html/install/installing#installing-from-the-operatorhub

const clusterDetails = {
  clusterName: 'testCluster',
  status: 'Ready',
  platform: 'IBM',
  cpuCores: '24',
  memorySize: '94 Gi',
  ocVersion: /^\d+\.\d+\.\d+$/,
};
let page: Page;
test.describe.serial('Test OCM plugin', () => {
  let uiHelper: UIhelper;
  let clusters: Clusters;
  let common: Common;

  test.beforeAll(async ({ browser }, testInfo) => {
    page = (await setupBrowser(browser, testInfo)).page;

    common = new Common(page);
    uiHelper = new UIhelper(page);
    clusters = new Clusters(page);

    await common.loginAsGithubUser();
  });
  test('Navigate to Clusters and Verify OCM Clusters', async () => {
    await uiHelper.openSidebar('Clusters');
    await uiHelper.verifyRowInTableByUniqueText(clusterDetails.clusterName, [
      clusterDetails.status,
      clusterDetails.platform,
    ]);
    await uiHelper.verifyRowInTableByUniqueText(clusterDetails.clusterName, [
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

  test('Navigate to Catalog > resources and verify cluster', async () => {
    await uiHelper.openSidebar('Catalog');
    await common.waitForLoad();
    await uiHelper.selectMuiBox('Kind', 'Resource');
    await uiHelper.verifyRowsInTable([clusterDetails.clusterName]);
    await uiHelper.clickLink(clusterDetails.clusterName);
    await clusters.verifyOCMClusterInfo(
      clusterDetails.clusterName,
      clusterDetails.status,
    );
  });
});
