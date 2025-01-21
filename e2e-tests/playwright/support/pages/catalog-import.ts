import { Page, expect } from "@playwright/test";
import { UIhelper } from "../../utils/ui-helper";
import {
  BACKSTAGE_SHOWCASE_COMPONENTS,
  CATALOG_IMPORT_COMPONENTS,
} from "../pageObjects/page-obj";
import { APIHelper } from "../../utils/api-helper";
import { GITHUB_API_ENDPOINTS } from "../../utils/api-endpoints";

export class CatalogImport {
  private page: Page;
  private uiHelper: UIhelper;

  constructor(page: Page) {
    this.page = page;
    this.uiHelper = new UIhelper(page);
  }
  async registerExistingComponent(
    url: string,
    clickViewComponent: boolean = true,
  ) {
    await this.page.fill(CATALOG_IMPORT_COMPONENTS.componentURL, url);
    await this.uiHelper.clickButton("Analyze");

    // Wait for the visibility of either 'Refresh' or 'Import' button
    if (await this.uiHelper.isBtnVisible("Import")) {
      await this.uiHelper.clickButton("Import");
      if (clickViewComponent) await this.uiHelper.clickButton("View Component");
    } else {
      await this.uiHelper.clickButton("Refresh");
      expect(await this.uiHelper.isBtnVisible("Register another")).toBeTruthy();
    }
  }

  async analyzeComponent(url: string) {
    await this.page.fill(CATALOG_IMPORT_COMPONENTS.componentURL, url);
    await this.uiHelper.clickButton("Analyze");
  }

  async inspectEntityAndVerifyYaml(text: string) {
    await this.page.getByTitle("More").click();
    await this.page.getByRole("menuitem").getByText("Inspect entity").click();
    await this.uiHelper.clickTab("Raw YAML");
    await expect(this.page.getByTestId("code-snippet")).toContainText(text);
    await this.uiHelper.clickButton("Close");
  }

  async clickOnScaffoldedFromLink() {
    const selector =
      'a[href*="/catalog/default/component/test-scaffoldedfromlink-"]';
    await this.page.locator(selector).first().waitFor({ state: "visible" });
    const link = this.page.locator(selector).first();
    await expect(link).toBeVisible();
    await link.click();
  }

  async verifyTextInSelector(
    selector: string,
    expectedText: string,
    exactMatch: boolean = true,
  ) {
    const elements = this.page.locator(selector);
    const count = await elements.count();

    for (let i = 0; i < count; i++) {
      const element = elements.nth(i);

      await element.waitFor({ state: 'visible', timeout: 10000 });

      const textContent = await element.textContent();

      if (textContent) {
        const isMatch = exactMatch
          ? textContent.trim() === expectedText.trim()
          : textContent.includes(expectedText);

        if (isMatch) {
          expect(textContent).toContain(expectedText); // Playwright assertion
          console.log(
            `Text "${expectedText}" verified successfully in selector: ${selector}`,
          );
          return;
        }
      }
    }

    // If no matching element was found, it throws an error directly
    const allTextContent = await elements.allTextContents();
    console.error(
      `Verification failed for text: Expected "${expectedText}". Selector content: ${allTextContent.join(", ")}`,
    );
    throw new Error(
      exactMatch
        ? `Expected exact text "${expectedText}" not found in selector "${selector}".`
        : `Expected partial text "${expectedText}" not found in selector "${selector}".`,
    );
  }

}

export class BackstageShowcase {
  private readonly page: Page;
  private uiHelper: UIhelper;

  constructor(page: Page) {
    this.page = page;
    this.uiHelper = new UIhelper(page);
  }

  async getGithubOpenIssues() {
    const rep = await APIHelper.getGithubPaginatedRequest(
      GITHUB_API_ENDPOINTS.issues("open"),
    );
    return rep.filter(
      (issue: { pull_request: boolean }) => !issue.pull_request,
    );
  }

  static async getShowcasePRs(
    state: "open" | "closed" | "all",
    paginated = false,
  ) {
    return await APIHelper.getGitHubPRs(
      "janus-idp",
      "backstage-showcase",
      state,
      paginated,
    );
  }

  async clickNextPage() {
    await this.page.click(BACKSTAGE_SHOWCASE_COMPONENTS.tableNextPage);
  }

  async clickPreviousPage() {
    await this.page.click(BACKSTAGE_SHOWCASE_COMPONENTS.tablePreviousPage);
  }

  async clickLastPage() {
    await this.page.click(BACKSTAGE_SHOWCASE_COMPONENTS.tableLastPage);
  }

  async clickFirstPage() {
    await this.page.click(BACKSTAGE_SHOWCASE_COMPONENTS.tableFirstPage);
  }

  async verifyPRRowsPerPage(rows, allPRs) {
    await this.selectRowsPerPage(rows);
    await this.uiHelper.verifyText(allPRs[rows - 1].title, false);
    await this.uiHelper.verifyLink(allPRs[rows].number, {
      exact: false,
      notVisible: false,
    });

    const tableRows = this.page.locator(
      BACKSTAGE_SHOWCASE_COMPONENTS.tableRows,
    );
    await expect(tableRows).toHaveCount(rows);
  }

  async selectRowsPerPage(rows: number) {
    await this.page.click(BACKSTAGE_SHOWCASE_COMPONENTS.tablePageSelectBox);
    await this.page.click(`ul[role="listbox"] li[data-value="${rows}"]`);
  }

  async getWorkflowRuns() {
    const response = await APIHelper.githubRequest(
      "GET",
      GITHUB_API_ENDPOINTS.workflowRuns,
    );
    const responseBody = await response.json();
    return responseBody.workflow_runs;
  }

  async verifyPRStatisticsRendered() {
    const regex = /Average Size Of PR\d+ lines/;
    await this.uiHelper.verifyText(regex);
  }

  async verifyAboutCardIsDisplayed() {
    const url =
      "https://github.com/redhat-developer/rhdh/tree/main/catalog-entities/components/";
    const isLinkVisible = await this.page
      .locator(`a[href="${url}"]`)
      .isVisible();
    if (!isLinkVisible) {
      throw new Error("About card is not displayed");
    }
  }

  async verifyPRRows(
    allPRs: { title: string }[],
    startRow: number,
    lastRow: number,
  ) {
    for (let i = startRow; i < lastRow; i++) {
      await this.uiHelper.verifyRowsInTable([allPRs[i].title], false);
    }
  }

}
