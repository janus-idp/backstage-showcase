import { Page } from '@playwright/test';
import { UIhelper } from '../../utils/UIhelper';
import { BackstageShowcasePO, CatalogImportPO } from '../pageObjects/page-obj';
import { APIHelper } from '../../utils/APIHelper';
import { githubAPIEndpoints } from '../../utils/APIEndpoints';

export class CatalogImport {
  private page: Page;
  private uiHelper: UIhelper;

  constructor(page: Page) {
    this.page = page;
    this.uiHelper = new UIhelper(page);
  }
  async registerExistingComponent(url: string) {
    await this.page.fill(CatalogImportPO.componentURL, url);
    await this.uiHelper.clickButton('Analyze');
    await this.uiHelper.clickButton('Import');
    await this.uiHelper.clickButton('View Component');
  }
}

export class BackstageShowcase {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async getGithubOpenIssues() {
    const response = await APIHelper.githubRequest(
      'GET',
      githubAPIEndpoints.issues('open'),
    );
    const body = await response.json();
    return body.filter((issue: any) => !issue.pull_request);
  }

  static async getGithubPRs(
    state: 'open' | 'closed' | 'all',
    paginated = false,
  ) {
    const url = githubAPIEndpoints.pull(state);
    if (paginated) {
      return APIHelper.getGithubPaginatedRequest(url);
    }
    const response = await APIHelper.githubRequest('GET', url);
    return response.json();
  }

  async clickNextPage() {
    await this.page.click(BackstageShowcasePO.tableNextPage);
  }

  async clickPreviousPage() {
    await this.page.click(BackstageShowcasePO.tablePreviousPage);
  }

  async clickLastPage(e) {
    await this.page.click(BackstageShowcasePO.tableLastPage);
  }

  async clickFirstPage() {
    await this.page.click(BackstageShowcasePO.tableFirstPage);
  }

  async verifyPRRowsPerPage(rows: number, allPRs: any[]) {
    await this.selectRowsPerPage(rows);
    const rowsCount = await this.page
      .locator(BackstageShowcasePO.tableRows)
      .count();
    if (rowsCount !== rows) {
      throw new Error(`Expected row count to be ${rows}, but got ${rowsCount}`);
    }
    await this.page.locator(`text=${allPRs[rows - 1].title}`).isVisible();
    const numberExists = await this.page
      .locator(`text=#${allPRs[rows].number}`)
      .isVisible();
    if (numberExists) {
      throw new Error(
        `Element with number ${allPRs[rows].number} should not exist`,
      );
    }
  }

  async selectRowsPerPage(rows: number) {
    await this.page.click(BackstageShowcasePO.tablePageSelectBox);
    await this.page.click(`ul[role="listbox"] li[data-value="${rows}"]`);
  }

  async verifyPRStatisticsRendered() {
    const regex = /Average Size Of PR\d+ lines/;
    const statsVisible = await this.page
      .locator('tr')
      .filter({ hasText: regex })
      .isVisible();
    if (!statsVisible) {
      throw new Error('PR statistics are not rendered');
    }
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
}
