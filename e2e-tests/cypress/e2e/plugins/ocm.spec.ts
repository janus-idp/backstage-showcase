import { Clusters } from '../../support/pages/Clusters';
import { Common } from '../../utils/Common';
import { UIhelper } from '../../utils/UIhelper';

//Pre-req: Enable janus-idp-backstage-plugin-ocm-backend-dynamic and janus-idp-backstage-plugin-ocm Plugins

describe('Test OCM plugin', () => {
  const clusterDetails = {
    clusterName: 'testCluster',
    status: 'Ready',
    platform: 'IBM',
    cpuCores: '12',
    memorySize: '47 Gi',
    ocVersion: '4.13.23',
  };

  before(() => {
    Common.loginAsGuest();
  });

  it('Navigate to Clusters and Verify OCM clustes', () => {
    UIhelper.openSidebar('Clusters');
    UIhelper.verifyRowsInTable([
      clusterDetails.clusterName,
      clusterDetails.status,
      clusterDetails.platform,
      clusterDetails.ocVersion,
    ]);
    UIhelper.clickLink(clusterDetails.clusterName);

    Clusters.verifyOCMLinksCardDetails();

    Clusters.verifyOCMAvailableCardDetails(
      clusterDetails.cpuCores,
      clusterDetails.memorySize,
    );
    Clusters.verifyOCMClusterInfo(
      clusterDetails.clusterName,
      clusterDetails.status,
    );
  });

  it('Navigate to Catalog > resouces and verify cluster', () => {
    UIhelper.openSidebar('Catalog');

    UIhelper.selectMuiBox('Kind', 'Resource');
    UIhelper.verifyRowsInTable([clusterDetails.clusterName]);

    UIhelper.clickLink(clusterDetails.clusterName);
    Clusters.verifyOCMClusterInfo(
      clusterDetails.clusterName,
      clusterDetails.status,
    );
  });
});
