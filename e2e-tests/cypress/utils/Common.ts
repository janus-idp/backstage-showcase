import { waitsObjs } from '../support/pageObjects/global-obj';
import { SettingsPagePO } from '../support/pageObjects/page-obj';
import { UIhelper } from './UIhelper';
import { authenticator } from 'otplib';

export class Common {
  static loginAsGuest() {
    cy.visit('/');
    UIhelper.verifyHeading('Select a sign-in method');
    UIhelper.clickButton('Enter');
  }

  static signOut() {
    cy.get(SettingsPagePO.userSettingsMenu).click();
    cy.get(SettingsPagePO.signOut).click();
    UIhelper.verifyHeading('Select a sign-in method');
  }

  static waitForLoad(timeout = 120000) {
    for (const item of Object.values(waitsObjs)) {
      cy.get(item, { timeout }).should('not.exist');
    }
  }

  static logintoGithub() {
    cy.visit('https://github.com/login');
    cy.get('#login_field').type(Cypress.env('GH_USER_ID'));
    cy.get('#password').type(Cypress.env('GH_USER_PASS'), { log: false });
    cy.get('[value="Sign in"]').click();
    cy.get('#app_totp').type(this.getGitHub2FAOTP(), { log: false });
  }

  static loginAsGithubUser() {
    this.logintoGithub();
    cy.visit('/');
    UIhelper.clickButton('Sign In');
  }

  static clickOnGHloginPopup() {
    UIhelper.clickButton('Log in');
    UIhelper.getButton('Log in', { timeout: 100000 }).should('not.exist');
  }

  static getGitHub2FAOTP(): string {
    const secret = Cypress.env('GH_2FA_SECRET');
    return authenticator.generate(secret);
  }
}
