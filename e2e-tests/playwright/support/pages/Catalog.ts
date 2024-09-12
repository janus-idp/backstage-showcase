import { Page } from '@playwright/test';
import { UIhelper } from '../../utils/UIhelper';

//${BASE_URL}/catalog page
export class Catalog {
  private page: Page;
  private uiHelper: UIhelper;

  constructor(page: Page) {
    this.page = page;
    this.uiHelper = new UIhelper(page);
  }

  async go() {
    await this.uiHelper.openSidebar('Catalog');
  }

  async goToBackstageJanusProjectCITab() {
    await this.goToBackstageJanusProject();
    await this.uiHelper.clickTab('CI');
    await this.page.waitForSelector('h2:text("Pipeline Runs")');
    await this.uiHelper.verifyHeading('Pipeline Runs');
  }

  async goToBackstageJanusProject() {
    await this.uiHelper.openSidebar('Catalog');
    await this.uiHelper.clickByDataTestId('user-picker-all');
    await this.uiHelper.clickLink('backstage-janus');
  }

  async search(s: string) {
    await this.page.locator('#input-with-icon-adornment').fill(s);
  }
}
