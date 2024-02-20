import { Page } from '@playwright/test';
import { UIhelper } from '../../utils/UIhelper';

export class Clusters {
  private page: Page;
  private uiHelper: UIhelper;

  constructor(page: Page) {
    this.page = page;
    this.uiHelper = new UIhelper(page);
  }

  async verifyOCMLinksCardDetails() {
    await this.uiHelper.verifyLinkinCard('Links', 'OpenShift Console', false);
    await this.uiHelper.verifyLinkinCard('Links', 'OCM Console', false);
    await this.uiHelper.verifyLinkinCard(
      'Links',
      'OpenShift Cluster Manager',
      false,
    );
  }

  async verifyOCMAvailableCardDetails(cpuCores: string, memorySize: string) {
    await this.uiHelper.verifyTextinCard('Available', `CPU cores${cpuCores}`);
    await this.uiHelper.verifyTextinCard(
      'Available',
      `Memory size${memorySize}`,
    );
  }

  async verifyOCMClusterInfo(clusterName: string, status: string) {
    await this.uiHelper.verifyTextinCard('Cluster Info', `Name${clusterName}`);
    await this.uiHelper.verifyTextinCard('Cluster Info', `Status${status}`);
  }
}
