import test, { expect, Locator, Page } from "@playwright/test";
import { UIhelperPO } from "../support/pageObjects/global-obj";

export const testWithHelper = test.extend<{ uiHelper: UIhelper }>({
  uiHelper: async ({ page }, use) => {
    const uiHelper = new UIhelper(page);
    await use(uiHelper);
  },
});
export class UIhelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async verifyComponentInCatalog(kind: string, expectedRows: string[]) {
    await this.openSidebar("Catalog");
    await this.selectMuiBox("Kind", kind);
    await this.verifyRowsInTable(expectedRows);
  }

  getSideBarMenuItem(menuItem: string): Locator {
    return this.page.getByTestId("login-button").getByText(menuItem);
  }

  async fillTextInputByLabel(label: string, text: string) {
    await this.page.getByLabel(label).fill(text);
  }

  async searchInputPlaceholder(searchText: string) {
    await this.page.fill('input[placeholder="Search"]', searchText);
  }

  async filterInputPlaceholder(searchText: string) {
    await this.page.fill('input[placeholder="Filter"]', searchText);
  }

  async pressTab() {
    await this.page.keyboard.press("Tab");
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

    if (options?.force) {
      await button.click({ force: true });
    } else {
      await button.click();
    }
    return button;
  }

  async clickBtnByTitleIfNotPressed(title: string) {
    const button = this.page.locator(`button[title="${title}"]`);
    const isPressed = await button.getAttribute("aria-pressed");

    if (isPressed === "false") {
      await button.click();
    }
  }

  async clickByDataTestId(dataTestId: string) {
    const element = this.page.getByTestId(dataTestId);
    await element.waitFor({ state: "visible" });
    await element.click();
  }

  async verifyDivHasText(divText: string) {
    await expect(
      this.page.locator(`div`).filter({ hasText: divText }),
    ).toBeVisible();
  }

  async clickLink(linkText: string) {
    await this.page.locator(`a`).filter({ hasText: linkText }).first().click();
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
      .locator("a")
      .getByText(linkText, { exact: options.exact })
      .first();

    if (options?.notVisible) {
      await expect(linkLocator).not.toBeVisible();
    } else {
      await linkLocator.scrollIntoViewIfNeeded();
      await expect(linkLocator).toBeVisible();
    }
  }

  private async isElementVisible(
    locator: string,
    timeout = 10000,
  ): Promise<boolean> {
    try {
      await this.page.waitForSelector(locator, {
        state: "visible",
        timeout: timeout,
      });
      const button = this.page.locator(locator).first();
      return button.isVisible();
    } catch (error) {
      return false;
    }
  }

  async isBtnVisibleByTitle(text: string): Promise<boolean> {
    const locator = `BUTTON[title="${text}"]`;
    return await this.isElementVisible(locator);
  }

  async isBtnVisible(text: string): Promise<boolean> {
    const locator = `button:has-text("${text}")`;
    return await this.isElementVisible(locator);
  }

  async isTextVisible(text: string, timeout = 10000): Promise<boolean> {
    const locator = `:has-text("${text}")`;
    return await this.isElementVisible(locator, timeout);
  }

  async isLinkVisible(text: string): Promise<boolean> {
    const locator = `a:has-text("${text}")`;
    return await this.isElementVisible(locator);
  }

  async waitForSideBarVisible() {
    await this.page.waitForSelector("nav a", { timeout: 120000 });
  }

  async openSidebar(navBarText: string) {
    const navLink = this.page
      .locator(`nav a:has-text("${navBarText}")`)
      .first();
    await navLink.waitFor({ state: "visible" });
    await navLink.click();
  }

  async openSidebarButton(navBarButtonLabel: string) {
    const navLink = this.page.locator(
      `nav button[aria-label="${navBarButtonLabel}"]`,
    );
    await navLink.waitFor({ state: "visible" });
    await navLink.click();
  }

  async selectMuiBox(label: string, value: string) {
    await this.page.click(`div[aria-label="${label}"]`);
    const optionSelector = `li[role="option"]:has-text("${value}")`;
    await this.page.waitForSelector(optionSelector);
    await this.page.click(optionSelector);
  }

  async verifyRowsInTable(
    rowTexts: (string | RegExp)[],
    exact: boolean = true,
  ) {
    for (const rowText of rowTexts) {
      await this.verifyTextInLocator(`tr>td`, rowText, exact);
    }
  }

  async waitForTextDisappear(text: string) {
    await this.page.waitForSelector(`text=${text}`, { state: "detached" });
  }

  async verifyText(text: string | RegExp, exact: boolean = true) {
    await this.verifyTextInLocator("", text, exact);
  }

  private async verifyTextInLocator(
    locator: string,
    text: string | RegExp,
    exact: boolean,
  ) {
    const elementLocator = locator
      ? this.page.locator(locator).getByText(text, { exact }).first()
      : this.page.getByText(text, { exact }).first();

    await elementLocator.waitFor({ state: "visible", timeout: 10000 });
    await elementLocator.waitFor({ state: "attached", timeout: 10000 });

    try {
      await elementLocator.scrollIntoViewIfNeeded();
    } catch (error) {
      console.warn(
        `Warning: Could not scroll element into view. Error: ${error.message}`,
      );
    }
    await expect(elementLocator).toBeVisible();
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
      await rowLocator.waitFor({ state: "visible" });
      await rowLocator.scrollIntoViewIfNeeded();
      await expect(rowLocator).toBeVisible();
    }
  }

  async verifyHeading(heading: string | RegExp) {
    const headingLocator = this.page
      .locator("h1, h2, h3, h4, h5, h6")
      .filter({ hasText: heading })
      .first();

    await headingLocator.waitFor({ state: "visible", timeout: 30000 });
    await expect(headingLocator).toBeVisible();
  }

  async verifyParagraph(paragraph: string) {
    const headingLocator = this.page
      .locator("p")
      .filter({ hasText: paragraph })
      .first();
    await headingLocator.waitFor({ state: "visible", timeout: 30000 });
    await expect(headingLocator).toBeVisible();
  }

  async waitForH4Title(text: string) {
    await this.page.waitForSelector(`h4:has-text("${text}")`, {
      timeout: 99999,
    });
  }

  async clickTab(tabName: string) {
    const tabLocator = this.page.locator(`text="${tabName}"`);
    await tabLocator.waitFor({ state: "visible" });
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

  /**
   * Verifies that a table row, identified by unique text, contains specific cell texts.
   * @param {string} uniqueRowText - The unique text present in one of the cells within the row. This is used to identify the specific row.
   * @param {Array<string | RegExp>} cellTexts - An array of cell texts or regular expressions to match against the cells within the identified row.
   * @example
   * // Example usage to verify that a row containing "Developer-hub" has cells with the texts "service" and "active":
   * await verifyRowInTableByUniqueText('Developer-hub', ['service', 'active']);
   */

  async verifyRowInTableByUniqueText(
    uniqueRowText: string,
    cellTexts: string[] | RegExp[],
  ) {
    const row = this.page.locator(UIhelperPO.rowByText(uniqueRowText));
    await row.waitFor();
    for (const cellText of cellTexts) {
      await expect(
        row.locator("td").filter({ hasText: cellText }).first(),
      ).toBeVisible();
    }
  }

  /**
   * Clicks on a link within a table row that contains a unique text and matches a link's text.
   * @param {string} uniqueRowText - The unique text present in one of the cells within the row. This is used to identify the specific row.
   * @param {string | RegExp} linkText - The text of the link, can be a string or a regular expression.
   * @param {boolean} [exact=true] - Whether to match the link text exactly. By default, this is set to true.
   */
  async clickOnLinkInTableByUniqueText(
    uniqueRowText: string,
    linkText: string | RegExp,
    exact = true,
  ) {
    const row = this.page.locator(UIhelperPO.rowByText(uniqueRowText));
    await row.waitFor();
    await row
      .locator("a")
      .getByText(linkText, { exact: exact })
      .first()
      .click();
  }

  /**
   * Clicks on a button within a table row that contains a unique text and matches a button's label or aria-label.
   * @param {string} UniqueRowText - The unique text present in one of the cells within the row. This is used to identify the specific row.
   * @param {string | RegExp} textOrLabel - The text of the button or the `aria-label` attribute, can be a string or a regular expression.
   */
  async clickOnButtonInTableByUniqueText(
    UniqueRowText: string,
    textOrLabel: string | RegExp,
  ) {
    const row = this.page.locator(UIhelperPO.rowByText(UniqueRowText));
    await row.waitFor();
    await row
      .locator(
        `button:has-text("${textOrLabel}"), button[aria-label="${textOrLabel}"]`,
      )
      .first()
      .click();
  }

  async verifyLinkinCard(cardHeading: string, linkText: string, exact = true) {
    const link = this.page
      .locator(UIhelperPO.MuiCard(cardHeading))
      .locator("a")
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

  // Function to convert hexadecimal to RGB or return RGB if it's already in RGB
  toRgb(color: string): string {
    if (color.startsWith("rgb")) {
      return color;
    }

    const bigint = parseInt(color.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgb(${r}, ${g}, ${b})`;
  }

  async checkCssColor(page: Page, selector: string, expectedColor: string) {
    const elements = await page.locator(selector);
    const count = await elements.count();
    const expectedRgbColor = this.toRgb(expectedColor);

    for (let i = 0; i < count; i++) {
      const color = await elements
        .nth(i)
        .evaluate((el) => window.getComputedStyle(el).color);
      expect(color).toBe(expectedRgbColor);
    }
  }

  async verifyTableIsEmpty() {
    const rowSelector = `table tbody tr:not(:has(td[colspan]))`;
    const rowCount = await this.page.locator(rowSelector).count();
    expect(rowCount).toEqual(0);
  }

  async waitForCardWithHeader(cardHeading: string) {
    await this.page.waitForSelector(UIhelperPO.MuiCard(cardHeading));
  }

  async verifyAlertErrorMessage(message: string | RegExp) {
    const alert = this.page.getByRole("alert");
    await alert.waitFor();
    await expect(alert).toHaveText(message);
  }

  async clickById(id: string) {
    await this.page.click(`#${id}`);
  }

  async clickSpanByText(text: string) {
    await this.verifyText(text);
    await this.page.click(`span:has-text("${text}")`);
  }

  async verifyLocationRefreshButtonIsEnabled(locationName: string) {
    await this.page.goto("/");
    await this.openSidebar("Catalog");
    await this.selectMuiBox("Kind", "Location");
    await this.verifyHeading("All locations");
    await this.verifyCellsInTable([locationName]);
    await this.clickLink(locationName);
    await this.verifyHeading(locationName);
    await this.page.locator(`button[title="Schedule entity refresh"]`).click();
    await this.verifyAlertErrorMessage("Refresh scheduled");

    const moreButton = await this.page
      .locator("button[aria-label='more']")
      .first();
    await moreButton.waitFor({ state: "visible" });
    await moreButton.waitFor({ state: "attached" });
    await moreButton.click();

    const unregisterItem = await this.page
      .locator("li[role='menuitem']")
      .filter({ hasText: "Unregister entity" })
      .first();
    await unregisterItem.waitFor({ state: "visible" });
    await unregisterItem.waitFor({ state: "attached" });
    expect(unregisterItem).not.toBeDisabled();
  }

  async clickUnregisterButtonForDisplayedEntity() {
    const moreButton = await this.page
      .locator("button[aria-label='more']")
      .first();
    await moreButton.waitFor({ state: "visible" });
    await moreButton.waitFor({ state: "attached" });
    await moreButton.click();

    const unregisterItem = await this.page
      .locator("li[role='menuitem']")
      .filter({ hasText: "Unregister entity" })
      .first();
    await unregisterItem.waitFor({ state: "visible" });
    await unregisterItem.click();

    const deleteButton = await this.page.getByRole("button", {
      name: "Delete Entity",
    });
    await deleteButton.waitFor({ state: "visible" });
    await deleteButton.waitFor({ state: "attached" });
    await deleteButton.click();
  }
}
