import { test as setup, expect, Page } from '@playwright/test';
import { Common } from '../../utils/Common';
import { authenticator } from 'otplib';
import {
  GH_USER2_IDAuthFile,
  GH_USER_IDAuthFile,
  GuestAuthFile,
} from './auth_constants';

async function onceGithubLogin(userId: string, password: string, page: Page) {
  await page.goto('https://github.com/login');
  await page.getByLabel('Username or email address').fill(userId);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.fill('#app_totp', getGitHub2FAOTP(userId));
  await expect(page.locator('#app_totp')).toBeHidden({
    timeout: 100000,
  });

  await page.waitForURL('https://github.com/');
}

function getGitHub2FAOTP(userid: string): string {
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
  new Common(page).loginAsGuest();
  await page.context().storageState({ path: GuestAuthFile });
});
