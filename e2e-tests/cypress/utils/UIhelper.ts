import { UIhelperPO } from '../support/pageObjects/global-obj';
import { Common } from './Common';

export class UIhelper {
  static clickButton(label: string, options?: { force?: boolean }) {
    if (options?.force) {
      return cy.contains(UIhelperPO.buttonLabel, label).click({ force: true });
    }
    return cy.contains(UIhelperPO.buttonLabel, label).click();
  }

  static getButton(
    label: string,
    options: { timeout: number } = { timeout: 40000 },
  ) {
    return cy.contains(UIhelperPO.buttonLabel, label, {
      timeout: options.timeout,
    });
  }

  static isHeaderTitleExists(label: string): Cypress.Chainable<boolean> {
    return cy.get('h2[data-testid="header-title"]').then(element => {
      return element.text() === label;
    });
  }

  static verifyDivHasText(divText: string) {
    return cy
      .contains('div', new RegExp(`^\\s*${divText}\\s*$`))
      .scrollIntoView()
      .should('be.visible');
  }

  static clickLink(linkText: string) {
    return cy
      .contains('a', new RegExp(`^\\s*${linkText}\\s*$`))
      .should('be.visible')
      .click();
  }

  static verifyLink(linkText: string, options?: { contains?: boolean }) {
    if (options?.contains) {
      return cy.contains('a', linkText).scrollIntoView().should('be.visible');
    }
    return cy
      .contains('a', new RegExp(`^\\s*${linkText}\\s*$`))
      .scrollIntoView()
      .should('be.visible');
  }

  static openSidebar(navBarText: string) {
    cy.contains('nav a', navBarText).should('be.visible').click();
    Common.waitForLoad();
  }

  static selectMuiBox(label: string, value: string) {
    cy.contains(UIhelperPO.MuiBoxLabel, label)
      .siblings('div[class*="MuiInputBase-root"]')
      .click();
    cy.contains('ul[role="listbox"] li[role="option"]', value).click();
    Common.waitForLoad();
  }

  static verifyRowsInTable(rowTexts: string[]) {
    rowTexts.forEach(rowText => {
      cy.contains(UIhelperPO.MuiTableRow, rowText)
        .scrollIntoView()
        .should('be.visible');
    });
  }

  static verifyHeading(heading: string) {
    cy.contains('h1, h2, h3, h4, h5, h6', new RegExp(`^\\s*${heading}\\s*$`))
      .scrollIntoView()
      .should('be.visible');
  }

  static clickTab(tabName: string) {
    cy.contains(UIhelperPO.tabs, new RegExp(`^\\s*${tabName}\\s*$`)).click();
  }

  static verifyCellsInTable(texts: Array<RegExp>) {
    texts.forEach(text => {
      cy.contains(UIhelperPO.MuiTableCell, text).should('be.visible');
    });
  }
}
