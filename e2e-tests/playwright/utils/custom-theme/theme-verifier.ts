import { Page, expect, TestInfo } from "@playwright/test";
import { UIhelper } from "../UIhelper";
import { UIhelperPO } from "../../support/pageObjects/global-obj";

export class ThemeVerifier {
  private readonly page: Page;
  private uiHelper: UIhelper;

  constructor(page: Page) {
    this.page = page;
    this.uiHelper = new UIhelper(page);
  }

  async setTheme(theme: "Light" | "Dark" | "Light Dynamic" | "Dark Dynamic") {
    await this.uiHelper.openSidebar("Settings");
    await this.uiHelper.clickBtnByTitleIfNotPressed(`Select theme ${theme}`);
  }

  async verifyHeaderGradient(expectedGradient: string) {
    const header = await this.page.locator("main header");
    await expect(header).toHaveCSS("background-image", expectedGradient);
  }

  async verifyBorderLeftColor(expectedColor: string) {
    const locator = await this.page.locator("a[aria-label='Settings']");
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
    await this.uiHelper.openSidebar("Catalog");
    await this.uiHelper.checkCssColor(
      this.page,
      UIhelperPO.MuiButtonTextPrimary,
      colorPrimary,
    );
    await this.uiHelper.openSidebar("Settings");
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
