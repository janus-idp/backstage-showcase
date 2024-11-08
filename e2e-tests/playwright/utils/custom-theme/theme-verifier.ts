import { Page, expect, TestInfo } from "@playwright/test";
import { UIhelper } from "../UIhelper";
import { UIhelperPO } from "../../support/pageObjects/global-obj";
import { Sidebar, SidebarOptions } from "../../support/pages/sidebar";

export class ThemeVerifier {
  private readonly page: Page;
  private uiHelper: UIhelper;
  private sidebar: Sidebar;

  constructor(page: Page) {
    this.page = page;
    this.uiHelper = new UIhelper(page);
    this.sidebar = new Sidebar(page);
  }

  async setTheme(theme: "Light" | "Dark") {
    await this.sidebar.open(SidebarOptions.Settings);
    await this.uiHelper.clickBtnByTitleIfNotPressed(`Select theme ${theme}`);
  }

  async verifyHeaderGradient(expectedGradient: string) {
    const header = this.page.locator("main header");
    await expect(header).toHaveCSS("background-image", expectedGradient);
  }

  async verifyBorderLeftColor(expectedColor: string) {
    const locator = this.page.locator("a[aria-label='Settings']");
    await expect(locator).toHaveCSS(
      "border-left",
      `3px solid ${expectedColor}`,
    );
  }

  async verifyPrimaryColors(colorPrimary: string) {
    await this.uiHelper.checkCssColor(
      this.page,
      UIhelperPO.MuiTypographyColorPrimary,
      colorPrimary,
    );
    await this.uiHelper.checkCssColor(
      this.page,
      UIhelperPO.MuiSwitchColorPrimary,
      colorPrimary,
    );
    await this.sidebar.open(SidebarOptions.Catalog);
    await this.uiHelper.checkCssColor(
      this.page,
      UIhelperPO.MuiButtonTextPrimary,
      colorPrimary,
    );
    await this.sidebar.open(SidebarOptions.Settings);
  }

  async takeScreenshotAndAttach(
    screenshotPath: string,
    testInfo: TestInfo,
    description: string,
  ) {
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    await testInfo.attach(description, { path: screenshotPath });
  }
}
