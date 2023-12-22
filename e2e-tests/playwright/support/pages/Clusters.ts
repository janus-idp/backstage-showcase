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
    const linksCard = await this.uiHelper.getMuiCard('Links');
    await this.uiHelper.verifyLink(`${linksCard} >> text=OpenShift Console`);
    await this.uiHelper.verifyLink(`${linksCard} >> text=OCM Console`);
    await this.uiHelper.verifyLink(
      `${linksCard} >> text=OpenShift Cluster Manager`,
    );
  }

  async verifyOCMAvailableCardDetails(cpuCores: string, memorySize: string) {
    const availableCard = await this.uiHelper.getMuiCard('Available');
    await this.uiHelper.verifyRowInTableByUniqueText(
      `${availableCard} >> text=CPU cores`,
      [cpuCores],
    );
    await this.uiHelper.verifyRowInTableByUniqueText(
      `${availableCard} >> text=Memory size`,
      [memorySize],
    );
  }

  async verifyOCMClusterInfo(clusterName: string, status: string) {
    const clusterInfoCard = await this.uiHelper.getMuiCard('Cluster Info');
    await this.uiHelper.verifyRowInTableByUniqueText(
      `${clusterInfoCard} >> text=Name`,
      [clusterName],
    );
    await this.uiHelper.verifyRowInTableByUniqueText(
      `${clusterInfoCard} >> text=Status`,
      [status],
    );
  }
}
