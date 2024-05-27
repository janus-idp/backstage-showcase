import { expect, Page } from '@playwright/test';
import { UIhelperPO } from '../support/pageObjects/global-obj';

export class UIhelper {
  private page: Page;
  private selectors: { [key: string]: string };

  constructor(page: Page) {
    this.page = page;
  }

  async verifyComponentInCatalog(kind: string, expectedRows: string[]) {
    await this.openSidebar('Catalog');
    await this.selectMuiBox('Kind', kind);
    await this.verifyRowsInTable(expectedRows);
  }

  async searchInputPlaceholder(searchText: string) {
    await this.page.fill('input[placeholder="Search"]', searchText);
  }

  async waitForHeaderTitle() {
    await this.page.waitForSelector('h2[data-testid="header-title"]');
  }

  async clickButton(
    label: string | RegExp,
    options: { exact?: boolean; force?: boolean } = {
      exact: true,
      force: false,
    },
  ) {
    const selector = `${UIhelperPO.MuiButtonLabel}`;
    const button = this.page
      .locator(selector)
      .getByText(label, { exact: options.exact })
      .first();
    await button.waitFor({ state: 'visible' });
    await button.waitFor({ state: 'attached' });

    if (options?.force) {
      await button.click({ force: true });
    } else {
      await button.click();
    }
    return button;
  }

  async verifyDivHasText(divText: string) {
    await expect(
      this.page.locator(`div`).filter({ hasText: divText }),
    ).toBeVisible();
  }

  async clickLink(linkText: string) {
    await this.page.locator(`a`).filter({ hasText: linkText }).click();
  }

  async verifyLink(
    linkText: string,
    options: {
      exact?: boolean;
      notVisible?: boolean;
    } = {
      exact: true,
      notVisible: false,
    },
  ) {
    const linkLocator = this.page
      .locator('a')
      .getByText(linkText, { exact: options.exact })
      .first();

    if (options?.notVisible) {
      await expect(linkLocator).not.toBeVisible();
    } else {
      await linkLocator.scrollIntoViewIfNeeded();
      await expect(linkLocator).toBeVisible();
    }
  }

  async verifyText(text: string | RegExp, exact: boolean = true) {
    const element = this.page.getByText(text, { exact: exact }).first();
    await element.scrollIntoViewIfNeeded();
    await expect(element).toBeVisible();
  }

  async isBtnVisible(text: string): Promise<boolean> {
    const locator = `button:has-text("${text}")`;
    try {
      await this.page.waitForSelector(locator, {
        state: 'visible',
        timeout: 10000,
      });
      const button = this.page.locator(locator);
      return button.isVisible();
    } catch (error) {
      return false;
    }
  }

  async waitForSideBarVisible() {
    await this.page.waitForSelector('nav a', { timeout: 120000 });
  }

  async openSidebar(navBarText: string) {
    const navLink = this.page.locator(`nav a:has-text("${navBarText}")`);
    await navLink.waitFor({ state: 'visible' });
    await navLink.click();
  }

  async selectMuiBox(label: string, value: string) {
    await this.page.click(`div[aria-label="${label}"]`);
    const optionSelector = `li[role="option"]:has-text("${value}")`;
    await this.page.waitForSelector(optionSelector);
    await this.page.click(optionSelector);
  }

  async verifyRowsInTable(
    rowTexts: string[] | RegExp[],
    exact: boolean = true,
  ) {
    for (const rowText of rowTexts) {
      const rowLocator = this.page
        .locator(`tr>td`)
        .getByText(rowText, { exact: exact })
        .first();
      await rowLocator.waitFor({ state: 'visible' });
      await rowLocator.waitFor({ state: 'attached' });
      await rowLocator.scrollIntoViewIfNeeded();
      await expect(rowLocator).toBeVisible();
    }
  }

  async verifyColumnHeading(
    rowTexts: string[] | RegExp[],
    exact: boolean = true,
  ) {
    for (const rowText of rowTexts) {
      const rowLocator = this.page
        .locator(`tr>th`)
        .getByText(rowText, { exact: exact })
        .first();
      await rowLocator.waitFor({ state: 'visible' });
      await rowLocator.scrollIntoViewIfNeeded();
      await expect(rowLocator).toBeVisible();
    }
  }

  async verifyHeading(heading: string) {
    const headingLocator = this.page
      .locator('h1, h2, h3, h4, h5, h6')
      .filter({ hasText: heading })
      .first();
    await headingLocator.waitFor({ state: 'visible', timeout: 30000 });
    await expect(headingLocator).toBeVisible();
  }

  async waitForH4Title(text: string) {
    await this.page.waitForSelector(`h4:has-text("${text}")`, {
      timeout: 99999,
    });
  }

  async clickTab(tabName: string) {
    const tabLocator = this.page.locator(`text="${tabName}"`);
    await tabLocator.click();
  }

  async verifyCellsInTable(texts: (string | RegExp)[]) {
    for (const text of texts) {
      const cellLocator = this.page
        .locator(UIhelperPO.MuiTableCell)
        .filter({ hasText: text });
      const count = await cellLocator.count();

      if (count === 0) {
        throw new Error(
          `Expected at least one cell with text matching ${text}, but none were found.`,
        );
      }

      // Checks if all matching cells are visible.
      for (let i = 0; i < count; i++) {
        await expect(cellLocator.nth(i)).toBeVisible();
      }
    }
  }

  async optionSelector(value: string) {
    const optionSelector = `li[role="option"]:has-text("${value}")`;
    await this.page.waitForSelector(optionSelector);
    await this.page.click(optionSelector);
  }

  getButtonSelector(label: string): string {
    return `${UIhelperPO.MuiButtonLabel}:has-text("${label}")`;
  }

  async verifyRowInTableByUniqueText(
    uniqueRowText: string,
    cellTexts: string[] | RegExp[],
  ) {
    const row = this.page.locator(UIhelperPO.rowByText(uniqueRowText));
    await row.waitFor();
    for (const cellText of cellTexts) {
      await expect(
        row.locator('td').filter({ hasText: cellText }).first(),
      ).toBeVisible();
    }
  }

  async verifyLinkinCard(cardHeading: string, linkText: string, exact = true) {
    const link = this.page
      .locator(UIhelperPO.MuiCard(cardHeading))
      .locator('a')
      .getByText(linkText, { exact: exact })
      .first();
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
  }

  async verifyTextinCard(
    cardHeading: string,
    text: string | RegExp,
    exact = true,
  ) {
    const locator = this.page
      .locator(UIhelperPO.MuiCard(cardHeading))
      .getByText(text, { exact: exact })
      .first();
    await locator.scrollIntoViewIfNeeded();
    await expect(locator).toBeVisible();
  }

  async verifyTableHeadingAndRows(texts: string[]) {
    for (const column of texts) {
      const columnSelector = `table th:has-text("${column}")`;
      //check if  columnSelector has at least one element or more
      const columnCount = await this.page.locator(columnSelector).count();
      expect(columnCount).toBeGreaterThan(0);
    }

    // Checks if the table has at least one row with data
    // Excludes rows that have cells spanning multiple columns, such as "No data available" messages
    const rowSelector = `table tbody tr:not(:has(td[colspan]))`;
    const rowCount = await this.page.locator(rowSelector).count();
    expect(rowCount).toBeGreaterThan(0);
  }
}
