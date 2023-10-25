import { HomePagePO } from "../pageObjects/page-obj";
import { UIhelper } from "../../utils/UIhelper";

export class HomePage {
    static verifyQuickSearchBar(text: string) {
        cy.get(HomePagePO.searchBar).should('be.visible').clear().type(text + "{enter}");
        UIhelper.verifyLink(text);
    }

    static verifyQuickAccess(section: string, quickAccessItem: string) {
        cy.contains(HomePagePO.MuiAccordion, section).contains('a div[class*="MuiListItemText-root"]', quickAccessItem).should("be.visible");
    }
}
