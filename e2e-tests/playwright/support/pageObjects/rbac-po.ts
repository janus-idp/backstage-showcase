import { Page } from "@playwright/test";
import { PageObject, PagesUrl } from "./page";

export class RbacPo extends PageObject {
  constructor(page: Page, url: PagesUrl = PagesUrl.rbac, go = true) {
    super(page, url, go);
  }

  async verifyGeneralRbacViewHeading() {
    await this.uiHelper.verifyHeading(/All roles \(\d+\)/);
  }

  async verifyUserRoleViewHeading(role: string) {
    await this.uiHelper.verifyHeading(role);
  }

  async verifyRoleIsListed(role: string) {
    await this.uiHelper.verifyLink(role);
  }

  async clickOnRoleLink(role: string) {
    await this.uiHelper.clickLink(role);
  }

  async switchToOverView() {
    await this.uiHelper.clickTab("Overview");
  }

  async verifyOverviewHeading(groups: number, policies: number) {
    await this.uiHelper.verifyHeading(`Users and groups (${groups} group)`);
    await this.uiHelper.verifyHeading(`Permission policies (${policies})`);
  }
}
