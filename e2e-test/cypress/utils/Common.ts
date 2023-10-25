import { waitsObjs } from "../support/pageObjects/global-obj";
import { SettingsPagePO } from "../support/pageObjects/page-obj";
import { UIhelper } from "./UIhelper";

export class Common {

    static loginAsGuest() {
        cy.visit('/')
        UIhelper.verifyHeading("Red Hat Developer Hub");
        UIhelper.verifyHeading("Select a sign-in method");
        UIhelper.clickButton('Enter')
    }

    static signOut(){
        cy.get(SettingsPagePO.userSettingsMenu).click();
        cy.get(SettingsPagePO.signOut).click();
        UIhelper.verifyHeading('Select a sign-in method');
    }

    static waitForLoad(timeout = 120000) {
        for (const item of Object.values(waitsObjs)) {
            cy.get(item, { timeout }).should('not.exist');
        }
    }
}
