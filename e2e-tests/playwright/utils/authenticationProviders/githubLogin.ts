import { authenticator } from 'otplib';
import { test, expect, Page, Cookie } from '@playwright/test';
import GithubAuthStorage from '../../support/storage/githubAuth';
import { UIhelper } from '../UIhelper';
import { Common } from '../Common';

export class GithubLogin {
  page: Page;
  uiHelper: UIhelper;

  constructor(page: Page) {
    this.page = page;
    this.uiHelper = new UIhelper(page);
  }

  async loginAsGithubUser(userid: string = process.env.GH_USER_ID) {
    if (GithubAuthStorage.getInstance().hasUsername(userid)) {
      await this.restoreCachedCredentials(userid);
    } else {
      await this.performLoginAndCacheCredentials(userid);
    }
    await this.uiHelper.waitForSideBarVisible();
  }

  private async restoreCachedCredentials(userid: string) {
    const authStorage = GithubAuthStorage.getInstance();
    const storageState = authStorage.getStorageState(userid);
    await this.page.goto('/');
    const context = this.page.context();

    const cookies: Cookie[] = storageState.cookies;
    await context.addCookies(cookies);

    const allLocalStorageItems = storageState.origins.flatMap(
      originState => originState.localStorage,
    );

    await this.page.evaluate(items => {
      for (const { name, value } of items) {
        localStorage.setItem(name, value);
      }
    }, allLocalStorageItems);
    await this.page.reload();
  }

  private async performLoginAndCacheCredentials(userid: string) {
    await this.logintoGithub(userid);
    await this.page.goto('/');
    await this.uiHelper.clickButton('Sign In');
    await this.checkAndReauthorizeGithubApp();
    GithubAuthStorage.getInstance().setStorageState(
      userid,
      await this.page.context().storageState(),
    );
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

  private async checkAndReauthorizeGithubApp() {
    await new Promise<void>(resolve => {
      this.page.once('popup', async popup => {
        await popup.waitForLoadState();

        // Check for popup closure for up to 10 seconds before proceeding
        for (let attempts = 0; attempts < 10 && !popup.isClosed(); attempts++) {
          await this.page.waitForTimeout(1000);
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

  async clickOnGHloginPopup() {
    await this.uiHelper.clickButton('Log in');
    await this.checkAndReauthorizeGithubApp();
    await this.page.waitForSelector(this.uiHelper.getButtonSelector('Log in'), {
      state: 'hidden',
      timeout: 100000,
    });
  }

  private getGitHub2FAOTP(userid: string): string {
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

  async githubLogin(username: string, password: string): Promise<string> {
    await this.page.goto('/');
    await this.page.waitForSelector('p:has-text("Sign in using GitHub")');
    await this.uiHelper.clickButton('Sign In');

    const popup = await this.page.waitForEvent('popup');
    const result = await new Common(this.page).handlePopupLogin(
      popup,
      username,
      password,
      {
        usernameSelector: '#login_field',
        passwordSelector: '#password',
        submitButtonSelector: "[type='submit']",
        successUrlStartsWith: process.env.BASE_URL,
        authorizationSelector: 'button.js-oauth-authorize-btn',
      },
    );
    return result;
  }
}
