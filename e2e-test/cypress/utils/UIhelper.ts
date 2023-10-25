import { UIhelperPO } from "../support/pageObjects/global-obj";
import { Common } from "./Common";

export class UIhelper {
    static clickButton(label: string) {
        return cy.contains(UIhelperPO.buttonLabel, label).should('be.visible').click();
    }

    static clickLink(linkText: string) {
        return cy.contains('a', new RegExp(`^\\s*${linkText}\\s*$`)).should('be.visible').click();
    }

    static verifyLink(linkText: string) {
        return cy.contains('a', new RegExp(`^\\s*${linkText}\\s*$`)).scrollIntoView().should('be.visible');
    }

    static openSidebar(navBarText: string) {
        cy.contains('nav a', navBarText).should('be.visible').click()
        Common.waitForLoad();
    }

    static selectMuiBox(label: string, value: string) {
        cy.contains(UIhelperPO.MuiBoxLabel, label).siblings('div[class*="MuiInputBase-root"]').click();
        cy.contains('ul[role="listbox"] li[role="option"]', value).click();
        Common.waitForLoad();
    }

    static verifyRowsInTable(rowTexts: string[]) {
        rowTexts.forEach((rowText) => {
            cy.contains(UIhelperPO.MuiTableRow, rowText).scrollIntoView().should('be.visible')
        })
    }

    static verifyHeading(heading: string) {
        cy.contains('h1, h2, h3, h4, h5, h6', new RegExp(`^\\s*${heading}\\s*$`)).scrollIntoView().should('be.visible');
    }
}
