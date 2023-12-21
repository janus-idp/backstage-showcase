import { UIhelper } from '../../utils/UIhelper';

export class Clusters {
  static verifyOCMLinksCardDetails() {
    UIhelper.getMuiCard('Links').within(() => {
      UIhelper.verifyLink('OpenShift Console', { contains: true });
      UIhelper.verifyLink('OCM Console', { contains: true });
      UIhelper.verifyLink('OpenShift Cluster Manager', { contains: true });
    });
  }

  static verifyOCMAvailableCardDetails(cpuCores: string, memorySize: string) {
    UIhelper.getMuiCard('Available').within(() => {
      UIhelper.verifyRowInTableByUniqueText('CPU cores', [cpuCores]);
      UIhelper.verifyRowInTableByUniqueText('Memory size', [memorySize]);
    });
  }
  static verifyOCMClusterInfo(clusterName: string, status: string) {
    UIhelper.getMuiCard('Cluster Info').within(() => {
      UIhelper.verifyRowInTableByUniqueText('Name', [clusterName]);
      UIhelper.verifyRowInTableByUniqueText('Status', [status]);
    });
  }
}
