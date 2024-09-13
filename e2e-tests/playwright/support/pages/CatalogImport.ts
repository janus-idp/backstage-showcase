import { Page, expect } from '@playwright/test';
import { UIhelper } from '../../utils/UIhelper';
import { BackstageShowcasePO, CatalogImportPO } from '../pageObjects/page-obj';
import { GithubApi, PRStatus } from '../api/github';

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
    await this.page.fill(CatalogImportPO.componentURL, url);
    await this.uiHelper.clickButton('Analyze');

    // Wait for the visibility of either 'Refresh' or 'Import' button
    if (await this.uiHelper.isBtnVisible('Import')) {
      await this.uiHelper.clickButton('Import');
      if (clickViewComponent) await this.uiHelper.clickButton('View Component');
    } else {
      await this.uiHelper.clickButton('Refresh');
      expect(await this.uiHelper.isBtnVisible('Register another')).toBeTruthy();
    }
  }

  async analyzeComponent(url: string) {
    await this.page.fill(CatalogImportPO.componentURL, url);
    await this.uiHelper.clickButton('Analyze');
  }

  async inspectEntityAndVerifyYaml(text: string) {
    await this.page.getByTitle('More').click();
    await this.page.getByRole('menuitem').getByText('Inspect entity').click();
    await this.uiHelper.clickTab('Raw YAML');
    await expect(this.page.getByTestId('code-snippet')).toContainText(text);
    await this.uiHelper.clickButton('Close');
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
    const gitHubApi = new GithubApi();
    const rep = gitHubApi.repository().issues(1);
    return rep.filter((issue: any) => !issue.pull_request);
  }

  static async getGithubPRs(state: PRStatus, paginated = false) {
    const gitHubApi = new GithubApi();
    const result = paginated
      ? gitHubApi.repository().pullRequests(1)
      : gitHubApi.repository().pullRequests();
    return await result;
  }

  async clickNextPage() {
    await this.page.click(BackstageShowcasePO.tableNextPage);
  }

  async clickPreviousPage() {
    await this.page.click(BackstageShowcasePO.tablePreviousPage);
  }

  async clickLastPage() {
    await this.page.click(BackstageShowcasePO.tableLastPage);
  }

  async clickFirstPage() {
    await this.page.click(BackstageShowcasePO.tableFirstPage);
  }

  async verifyPRRowsPerPage(rows, allPRs) {
    await this.selectRowsPerPage(rows);
    await this.uiHelper.verifyText(allPRs[rows - 1].title, false);
    await this.uiHelper.verifyLink(allPRs[rows].number, {
      exact: false,
      notVisible: false,
    });

    const tableRows = this.page.locator(BackstageShowcasePO.tableRows);
    await expect(tableRows).toHaveCount(rows);
  }

  async selectRowsPerPage(rows: number) {
    await this.page.click(BackstageShowcasePO.tablePageSelectBox);
    await this.page.click(`ul[role="listbox"] li[data-value="${rows}"]`);
  }

  async getWorkflowRuns() {
    const response = await new GithubApi().repository().actions().runs();
    const responseBody = await response.json();
    return responseBody.workflow_runs;
  }

  async verifyPRStatisticsRendered() {
    const regex = /Average Size Of PR\d+ lines/;
    await this.uiHelper.verifyText(regex);
  }

  async verifyAboutCardIsDisplayed() {
    const url =
      'https://github.com/janus-idp/backstage-showcase/tree/main/catalog-entities/components/';
    const isLinkVisible = await this.page
      .locator(`a[href="${url}"]`)
      .isVisible();
    if (!isLinkVisible) {
      throw new Error('About card is not displayed');
    }
  }

  async verifyPRRows(allPRs: any[], startRow: number, lastRow: number) {
    for (let i = startRow; i < lastRow; i++) {
      await this.uiHelper.verifyRowsInTable([allPRs[i].title], false);
    }
  }
}
