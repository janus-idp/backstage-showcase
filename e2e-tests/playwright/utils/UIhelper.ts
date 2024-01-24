import { expect, Page } from '@playwright/test';
import { UIhelperPO } from '../support/pageObjects/global-obj';

export class UIhelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async verifyComponentInCatalog(kind: string, expectedRows: string[]) {
    await this.openSidebar('Catalog');
    await this.selectMuiBox('Kind', kind);
    await this.verifyRowsInTable(expectedRows);
  }

  async waitForHeaderTitle() {
    await this.page.waitForSelector('h2[data-testid="header-title"]');
  }

  async clickButton(label: string, options?: { force?: boolean }) {
    const selector = `${UIhelperPO.buttonLabel}:has-text("${label}")`;
    await this.page.waitForSelector(selector);
    if (options?.force) {
      await this.page.click(selector, { force: true });
    } else {
      await this.page.click(selector);
    }
  }

  async getButton(
    label: string,
    options: { timeout: number } = { timeout: 40000 },
  ) {
    const selector = `${UIhelperPO.buttonLabel}`;
    await this.page.waitForSelector(selector, { timeout: options.timeout });
    return this.page.locator(selector).filter({ hasText: label });
  }

  async isHeaderTitleExists(label: string): Promise<boolean> {
    const headerTitle = await this.page
      .locator(`h2[data-testid="header-title"]`)
      .textContent();
    return headerTitle === label;
  }

  async verifyDivHasText(divText: string) {
    await expect(
      this.page.locator(`div`).filter({ hasText: divText }),
    ).toBeVisible();
  }

  async clickLink(linkText: string) {
    await this.page.locator(`a`).filter({ hasText: linkText }).click();
  }

  async verifyLink(linkText: string, options?: { contains?: boolean }) {
    let linkLocator;
    if (options?.contains) {
      linkLocator = this.page.locator(`a >> text=${linkText}`);
    } else {
      linkLocator = this.page.locator(`a >> text=/^\\s*${linkText}\\s*$/i`);
    }

    await linkLocator.scrollIntoViewIfNeeded();
    await expect(linkLocator).toBeVisible();
  }

  async waitForSideBarVisible() {
    await this.page.waitForSelector('nav a');
  }

  async openSidebar(navBarText: string) {
    await this.page.locator(`nav a`).filter({ hasText: navBarText }).click();
  }

  async selectMuiBox(label: string, value: string) {
    await this.page.click(`div[aria-label="${label}"]`);
    const optionSelector = `li[role="option"]:has-text("${value}")`;
    await this.page.waitForSelector(optionSelector);
    await this.page.click(optionSelector);
  }

  async verifyRowsInTable(rowTexts: string[]) {
    for (const rowText of rowTexts) {
      const rowLocator = this.page
        .locator(UIhelperPO.MuiTableRow)
        .filter({ hasText: rowText });
      await expect(rowLocator).toBeVisible();
    }
  }

  async verifyHeading(heading: string) {
    await this.page.waitForSelector(`h1, h2, h3, h4, h5, h6`, {
      timeout: 99999,
    });
    const headingLocator = this.page
      .locator(`h1, h2, h3, h4, h5, h6`)
      .filter({ hasText: heading });

    // Check if at least one matching element is visible
    const count = await headingLocator.count();
    let isVisible = false;
    for (let i = 0; i < count; i++) {
      if (await headingLocator.nth(i).isVisible()) {
        isVisible = true;
        break; // Exit the loop if any visible element is found
      }
    }
    // Assert that at least one element is visible, else the test will fail
    expect(
      isVisible,
      `No heading containing "${heading}" is visible.`,
    ).toBeTruthy();
  }

  async waitForH4Title(text: string) {
    await this.page.waitForSelector(`h4:has-text("${text}")`, {
      timeout: 99999,
    });
  }

  async clickTab(tabName: string) {
    const tabLocator = this.page
      .locator(UIhelperPO.tabs)
      .filter({ hasText: tabName });
    await tabLocator.click();
  }

  async verifyCellsInTable(texts: RegExp[]) {
    for (const text of texts) {
      const cellLocator = this.page
        .locator(UIhelperPO.MuiTableCell)
        .filter({ hasText: text });
      await expect(cellLocator).toBeVisible();
    }
  }

  getButtonSelector(label: string): string {
    return `span[class^="MuiButton-label"]:has-text("${label}")`;
  }

  async verifyRowInTableByUniqueText(
    uniqueRowText: string | RegExp,
    cellTexts: string[],
  ) {
    const uniqueCell = this.page
      .locator(UIhelperPO.MuiTableCell)
      .locator(`text=${uniqueRowText}`);
    await uniqueCell.scrollIntoViewIfNeeded();
    const row = uniqueCell.locator('xpath=ancestor::tr');

    for (const cellText of cellTexts) {
      const cell = row
        .locator(UIhelperPO.MuiTableCell)
        .locator(`text=${cellText}`);
      await expect(cell).toBeVisible();
    }
  }

  async getMuiCard(title: string) {
    const cardHeader = this.page
      .locator(UIhelperPO.MuiCardHeader)
      .locator(`text=${title}`);
    const card = cardHeader.locator(
      'xpath=ancestor::div[contains(@class, "MuiCard-root")]',
    );
    await card.scrollIntoViewIfNeeded();

    return card;
  }
}
