import { UIhelper } from './UIhelper';
import { authenticator } from 'otplib';
import { Page } from '@playwright/test';
import { SettingsPagePO } from '../support/pageObjects/page-obj';
import { waitsObjs } from '../support/pageObjects/global-obj';

export class Common {
  page: Page;
  uiHelper: UIhelper;

  constructor(page: Page) {
    this.page = page;
    this.uiHelper = new UIhelper(page);
  }

  async loginAsGuest() {
    await this.page.goto('/');
    await this.uiHelper.verifyHeading('Select a sign-in method');
    await this.uiHelper.clickButton('Enter');
    await this.uiHelper.waitForSideBarVisible();
  }

  async waitForLoad(timeout = 120000) {
    for (const item of Object.values(waitsObjs)) {
      await this.page.waitForSelector(item, {
        state: 'hidden',
        timeout: timeout,
      });
    }
  }

  async signOut() {
    await this.page.click(SettingsPagePO.userSettingsMenu);
    await this.page.click(SettingsPagePO.signOut);
    await this.uiHelper.verifyHeading('Select a sign-in method');
  }

  async logintoGithub() {
    await this.page.goto('https://github.com/login');
    await this.page.waitForSelector('#login_field');
    await this.page.fill('#login_field', process.env.GH_USER_ID);
    await this.page.fill('#password', process.env.GH_USER_PASS);
    await this.page.click('[value="Sign in"]');
    await this.page.fill('#app_totp', this.getGitHub2FAOTP());
    await this.page.waitForLoadState('networkidle');
  }

  async loginAsGithubUser() {
    await this.logintoGithub();
    await this.page.goto(process.env.BASE_URL);
    await this.uiHelper.clickButton('Sign In');
    await this.checkAndReauthorizeGithubApp();
    await this.uiHelper.waitForSideBarVisible();
  }

  async checkAndReauthorizeGithubApp() {
    await new Promise<void>(resolve => {
      this.page.once('popup', async popup => {
        await popup.waitForLoadState();

        // Check for popup closure for up to 10 seconds before proceeding
        for (let attempts = 0; attempts < 10 && !popup.isClosed(); attempts++) {
          await this.page.waitForTimeout(1000); // Using page here because if the popup closes automatically, it throws an error during the wait
        }

        const locator = popup.locator('#js-oauth-authorize-btn');
        if (!popup.isClosed() && (await locator.isVisible())) {
          await popup.locator('body').click();
          await locator.waitFor();
          await locator.click();
        }
        resolve();
      });
    });
  }
  async googleSignIn(email: string) {
    await new Promise<void>(resolve => {
      this.page.once('popup', async popup => {
        await popup.waitForLoadState();
        const locator = popup
          .getByRole('link', { name: email, exact: false })
          .first();
        await popup.waitForTimeout(3000);
        await locator.waitFor({ state: 'visible' });
        await locator.click({ force: true });
        await popup.waitForTimeout(3000);
        await popup
          .getByRole('button', { name: /Continue|Weiter/ })
          .click({ timeout: 60000 });
        resolve();
      });
    });
  }

  async clickOnGHloginPopup() {
    await this.uiHelper.clickButton('Log in');
    await this.checkAndReauthorizeGithubApp();
    await this.page.waitForSelector(this.uiHelper.getButtonSelector('Log in'), {
      state: 'hidden',
      timeout: 100000,
    });
  }

  getGitHub2FAOTP(): string {
    const secret = process.env.GH_2FA_SECRET;
    return authenticator.generate(secret);
  }
}
