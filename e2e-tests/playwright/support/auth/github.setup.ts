import { test as setup, Page } from "@playwright/test";
import { authenticator } from "otplib";
import {
  GH_USER2_IDAuthFile,
  GH_USER_IDAuthFile,
  RBAC_IDAuthFile,
} from "./auth_constants";
import { UIhelper } from "../../utils/UIhelper";
import { Common } from "../../utils/Common";

async function onceGithubLogin(userId: string, password: string, page: Page) {
  const uiHelper: UIhelper = new UIhelper(page);
  const githubLoginEmail = page.locator("#login_field");
  const githubLoginPassword = page.locator("#password");
  const githubLoginSignIn = page.locator('[value="Sign in"]');
  const githubLogin2ndFactor = page.locator("#app_totp");

  await page.goto("https://github.com/login");
  await githubLoginEmail.fill(userId);
  await githubLoginPassword.fill(password);
  await githubLoginSignIn.click();
  await githubLogin2ndFactor.fill(await getGitHub2FAOTP(userId));
  await page.waitForURL("https://github.com/");
  await page.waitForTimeout(5000);
  await page.goto("/");
  await page.getByRole("button", { name: "Sign In" }).click();
  await new Common(page).checkAndReauthorizeGithubApp();
  await uiHelper.waitForSideBarVisible();
  await page.waitForTimeout(2000);
}

async function getGitHub2FAOTP(userid: string): Promise<string> {
  const secrets: { [key: string]: string | undefined } = {
    [process.env.GH_USER_ID]: process.env.GH_2FA_SECRET,
    [process.env.GH_USER2_ID]: process.env.GH_USER2_2FA_SECRET,
  };

  const secret = secrets[userid];
  if (!secret) {
    throw new Error("Invalid User ID");
  }
  // Ensure always getting a new code, max is 30 seconds + 100ms to avoid race conditions
  await new Promise((resolve) =>
    setTimeout(resolve, authenticator.timeRemaining() * 1000 + 100),
  );
  return authenticator.generate(secret);
}

const authConfigs = [
  {
    testName: "authenticate as GH_USER_ID",
    userId: process.env.GH_USER_ID,
    password: process.env.GH_USER_PASS,
    storageFilePath: GH_USER_IDAuthFile,
  },
  {
    testName: "authenticate as GH_USER2_ID",
    userId: process.env.GH_USER2_ID,
    password: process.env.GH_USER2_PASS,
    storageFilePath: GH_USER2_IDAuthFile,
  },
  {
    testName: "authenticate for RBAC",
    userId: process.env.GH_USER_ID,
    password: process.env.GH_USER_PASS,
    storageFilePath: RBAC_IDAuthFile,
  },
];

for (const { testName, userId, password, storageFilePath } of authConfigs) {
  setup(testName, async ({ page }) => {
    setup.setTimeout(80000);
    await onceGithubLogin(userId, password, page);
    await page.context().storageState({
      path: storageFilePath,
    });
  });
}
