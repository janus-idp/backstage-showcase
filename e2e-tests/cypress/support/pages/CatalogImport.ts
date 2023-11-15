import { CatalogImportPO, BackstageShowcasePO } from '../pageObjects/page-obj';
import { UIhelper } from '../../utils/UIhelper';
import { APIHelper } from '../../utils/APIHelper';
import { githubAPIEndpoints } from '../../utils/APIEndpoints';

export class CatalogImport {
  static registerExistingComponent(url: string) {
    cy.get(CatalogImportPO.componentURL).clear().type(url);
    UIhelper.clickButton('Analyze');
    UIhelper.clickButton('Import');
    UIhelper.clickButton('View Component');
  }
}

export class BackstageShowcase {
  static getGithubOpenIssues() {
    return APIHelper.githubRequest('GET', githubAPIEndpoints.issues('open'))
      .its('body')
      .then(body => {
        return body.filter((issue: any) => !issue.pull_request);
      });
  }

  static getGithubPRs(state: 'open' | 'closed' | 'all', paginated = false) {
    const url = githubAPIEndpoints.pull(state);
    if (paginated) {
      return APIHelper.getGithubPaginatedRequest(url);
    }
    return APIHelper.githubRequest('GET', url).its('body');
  }

  static clickNextPage() {
    cy.get(BackstageShowcasePO.tableNextPage).click();
  }

  static clickPreviousPage() {
    cy.get(BackstageShowcasePO.tablePreviousPage).click();
  }

  static clickLastPage() {
    return cy.get(BackstageShowcasePO.tableLastPage).click();
  }

  static clickFirstPage() {
    cy.get(BackstageShowcasePO.tableFirstPage).click();
  }

  static verifyPRRowsPerPage(rows: number, allPRs: any[]) {
    BackstageShowcase.selectRowsPerPage(rows);
    cy.contains(allPRs[rows - 1].title)
      .scrollIntoView()
      .should('be.visible');
    cy.contains(allPRs[rows].title).should('not.exist');
    cy.get(BackstageShowcasePO.tableRows).should('have.length', rows);
  }

  static selectRowsPerPage(rows: number) {
    cy.get(BackstageShowcasePO.tablePageSelectBox).click();
    cy.get(`ul[role="listbox"] li[data-value="${rows}"]`).click();
  }

  static getWorkflowRuns() {
    return APIHelper.githubRequest('GET', githubAPIEndpoints.workflowRuns).its(
      'body.workflow_runs',
    );
  }

  static verifyPRStatisticsRendered() {
    cy.contains('tr', /Average Size Of PR(\d+).*lines/g).should('be.visible');
  }

  static verifyAboutCardIsDisplayed() {
    cy.get(
      'a[href="https://github.com/janus-idp/backstage-showcase/tree/main/catalog-entities/components/"]',
    ).should('be.visible');
  }

  static verifyPRRows(allPRs: any[], startRow: number, lastRow: number) {
    allPRs.slice(startRow, lastRow).forEach(allPR => {
      cy.contains(allPR.title).should('be.visible');
    });
  }
}
