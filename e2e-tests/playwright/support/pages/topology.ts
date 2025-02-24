import { Page } from "@playwright/test";

export class Topology {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async hoverOnPodStatusIndicator() {
    const locator = this.page
      .locator('[data-test-id="topology-test"]')
      .getByText("1")
      .first();
    await locator.hover();
    await this.page.waitForTimeout(1000);
  }
}
