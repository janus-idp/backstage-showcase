import { Locator, Page } from "@playwright/test";
import { UIhelper } from "../../utils/UIhelper";
import playwrightConfig from "../../../playwright.config";
import { Sidebar, SidebarOptions } from "./sidebar";

//${BASE_URL}/catalog page
export class Catalog {
  private page: Page;
  private uiHelper: UIhelper;
  private searchField: Locator;
  private sidebar: Sidebar;

  constructor(page: Page) {
    this.page = page;
    this.uiHelper = new UIhelper(page);
    this.searchField = page.locator("#input-with-icon-adornment");
    this.sidebar = new Sidebar(page);
  }

  async go() {
    await this.sidebar.open(SidebarOptions.Catalog);
  }

  async goToBackstageJanusProjectCITab() {
    await this.goToBackstageJanusProject();
    await this.uiHelper.clickTab("CI");
    await this.page.waitForSelector('h2:text("Pipeline Runs")');
    await this.uiHelper.verifyHeading("Pipeline Runs");
  }

  async goToBackstageJanusProject() {
    await this.go();
    await this.uiHelper.clickByDataTestId("user-picker-all");
    await this.uiHelper.clickLink("backstage-janus");
  }

  async search(s: string) {
    await this.searchField.clear();
    const searchResponse = this.page.waitForResponse(
      new RegExp(
        `${playwrightConfig.use.baseURL}/api/catalog/entities/by-query/*`,
      ),
    );
    await this.searchField.fill(s);
    await searchResponse;
  }

  async tableRow(content: string) {
    return this.page.locator(`tr >> a >> text="${content}"`);
  }
}
