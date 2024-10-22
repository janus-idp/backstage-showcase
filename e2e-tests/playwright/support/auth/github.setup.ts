import { test as setup, expect, Page, Locator } from '@playwright/test';
import { Common } from '../../utils/Common';
import { authenticator } from 'otplib';
import {
  GH_USER2_IDAuthFile,
  GH_USER_IDAuthFile,
  GuestAuthFile,
} from './auth_constants';

async function onceGithubLogin(userId: string, password: string, page: Page) {
  const githubLoginEmail: Locator = page.locator('#login_field');
  const githubLoginPassword: Locator = page.locator('#password');
  const githubLoginSignIn: Locator = page.locator('[value="Sign in"]');
  const githubLogin2ndFactor: Locator = page.locator('#app_totp');

  await page.goto('https://github.com/login');
  await githubLoginEmail.fill(userId);
  await githubLoginPassword.fill(password);
  await githubLoginSignIn.click();

  await githubLogin2ndFactor.fill(await getGitHub2FAOTP(userId));
  await page.waitForURL('https://github.com/');
}

async function getGitHub2FAOTP(userid: string): Promise<string> {
  const secrets: { [key: string]: string | undefined } = {
    [process.env.GH_USER_ID]: process.env.GH_2FA_SECRET,
    [process.env.GH_USER2_ID]: process.env.GH_USER2_2FA_SECRET,
  };

  const secret = secrets[userid];
  if (!secret) {
    throw new Error('Invalid User ID');
  }
  //with this, we ensure having always a new code, max is 30 seconds + 100ms to avoid race conditions
  //https://www.npmjs.com/package/otplib#getting-time-remaining--time-used
  await new Promise(resolve =>
    setTimeout(resolve, authenticator.timeRemaining() * 1000 + 100),
  );
  return authenticator.generate(secret);
}

setup('authenticate as GH_USER_ID', async ({ page }) => {
  const userId = process.env.GH_USER_ID;
  const password = process.env.GH_USER_PASS;
  await onceGithubLogin(userId, password, page);
  await page.context().storageState({ path: GH_USER_IDAuthFile });
});

setup('authenticate as GH_USER2_ID', async ({ page }) => {
  const userId = process.env.GH_USER2_ID;
  const password = process.env.GH_USER2_PASS;
  await onceGithubLogin(userId, password, page);
  await page.context().storageState({ path: GH_USER2_IDAuthFile });
});

setup('authenticate as Guest', async ({ page }) => {
  await new Common(page).loginAsGuest();
  await page.context().storageState({ path: GuestAuthFile });
});
