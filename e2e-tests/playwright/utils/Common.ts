import { UIhelper } from './UIhelper';
import { authenticator } from 'otplib';
import { test, Browser, expect, Page, TestInfo } from '@playwright/test';
import { SettingsPagePO } from '../support/pageObjects/page-obj';
import { waitsObjs } from '../support/pageObjects/global-obj';
import path from 'path';

export class Common {
  page: Page;
  uiHelper: UIhelper;

  constructor(page: Page) {
    this.page = page;
    this.uiHelper = new UIhelper(page);
  }

  async loginAsGuest() {
    await this.page.goto('/');
    await this.waitForLoad(240000);
    // TODO - Remove it after https://issues.redhat.com/browse/RHIDP-2043. A Dynamic plugin for Guest Authentication Provider needs to be created
    this.page.on('dialog', async dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });

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

  private async logintoGithub(userid: string) {
    await this.page.goto('https://github.com/login');
    await this.page.waitForSelector('#login_field');
    await this.page.fill('#login_field', userid);

    switch (userid) {
      case process.env.GH_USER_ID:
        await this.page.fill('#password', process.env.GH_USER_PASS);
        break;
      case process.env.GH_USER2_ID:
        await this.page.fill('#password', process.env.GH_USER2_PASS);
        break;
      default:
        throw new Error('Invalid User ID');
    }

    await this.page.click('[value="Sign in"]');
    await this.page.fill('#app_totp', this.getGitHub2FAOTP(userid));
    test.setTimeout(130000);
    if (
      (await this.uiHelper.isTextVisible(
        'The two-factor code you entered has already been used',
      )) ||
      (await this.uiHelper.isTextVisible(
        'too many codes have been submitted',
        3000,
      ))
    ) {
      await this.page.waitForTimeout(60000);
      await this.page.fill('#app_totp', this.getGitHub2FAOTP(userid));
    }
    await expect(this.page.locator('#app_totp')).toBeHidden({
      timeout: 120000,
    });
  }

  async loginAsGithubUser(userid: string = process.env.GH_USER_ID) {
    await this.logintoGithub(userid);
    await this.page.goto('/');
    await this.waitForLoad(240000);
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

        const locator = popup.locator('button.js-oauth-authorize-btn');
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

        await popup.locator('[name=Passwd]').fill(process.env.GOOGLE_USER_PASS);
        await popup.locator('[name=Passwd]').press('Enter');
        await popup.waitForTimeout(3500);
        await popup.locator('[name=totpPin]').fill(this.getGoogle2FAOTP());
        await popup.locator('[name=totpPin]').press('Enter');
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

  getGitHub2FAOTP(userid: string): string {
    const secrets: { [key: string]: string | undefined } = {
      [process.env.GH_USER_ID]: process.env.GH_2FA_SECRET,
      [process.env.GH_USER2_ID]: process.env.GH_USER2_2FA_SECRET,
    };

    const secret = secrets[userid];
    if (!secret) {
      throw new Error('Invalid User ID');
    }

    return authenticator.generate(secret);
  }

  getGoogle2FAOTP(): string {
    const secret = process.env.GOOGLE_2FA_SECRET;
    return authenticator.generate(secret);
  }
}

export async function setupBrowser(browser: Browser, testInfo: TestInfo) {
  const context = await browser.newContext({
    recordVideo: {
      dir: `test-results/${path
        .parse(testInfo.file)
        .name.replace('.spec', '')}`,
      size: { width: 1920, height: 1080 },
    },
  });
  const page = await context.newPage();
  return { page, context };
}
