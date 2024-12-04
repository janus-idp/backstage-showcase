import { expect, Page, test } from "@playwright/test";
import { Common, setupBrowser } from "../../utils/common";
import { UIhelper } from "../../utils/ui-helper";
import { Clusters } from "../../support/pages/clusters";

//Pre-req: Enable backstage-community-plugin-ocm-backend-dynamic and backstage-community-plugin-ocm Plugins
//Pre-req: Install Advanced Cluster Management for Kubernetes "MultiClusterHub"
// https://access.redhat.com/documentation/en-us/red_hat_advanced_cluster_management_for_kubernetes/2.10/html/install/installing#installing-from-the-operatorhub

const clusterDetails = {
  clusterName: "testCluster",
  status: "Ready",
  platform: "IBM",
  cpuCores: /CPU cores\d+/,
  memorySize: /Memory size\d.*(Gi|Mi)/,
  ocVersion: /^\d+\.\d+\.\d+$/,
};
let page: Page;
test.describe.serial("Test OCM plugin", () => {
  let uiHelper: UIhelper;
  let clusters: Clusters;
  let common: Common;

  test.beforeAll(async ({ browser }, testInfo) => {
    page = (await setupBrowser(browser, testInfo)).page;

    common = new Common(page);
    uiHelper = new UIhelper(page);
    clusters = new Clusters(page);

    await common.loginAsGuest();
  });
  test("Navigate to Clusters and Verify OCM Clusters", async () => {
    await uiHelper.openSidebar("Clusters");
    const expectedPath = "/ocm";

    // Wait for the expected path in the URL
    await page.waitForURL(`**${expectedPath}`, {
      waitUntil: "domcontentloaded", // Wait until the DOM is loaded
      timeout: 10000, // Set timeout to 10 seconds
    });

    expect(page.url()).toContain(expectedPath);

    await uiHelper.verifyHeading("Your Managed Clusters");
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

  test("Navigate to Catalog > resources and verify cluster", async () => {
    await uiHelper.openSidebar("Catalog");
    await common.waitForLoad();
    await uiHelper.selectMuiBox("Kind", "Resource");
    await uiHelper.verifyRowsInTable([clusterDetails.clusterName]);
    await uiHelper.clickLink(clusterDetails.clusterName);
    await clusters.verifyOCMClusterInfo(
      clusterDetails.clusterName,
      clusterDetails.status,
    );
  });
});
