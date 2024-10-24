import { test as setup, Page, Locator } from "@playwright/test";
import { authenticator } from "otplib";
import { GH_USER2_IDAuthFile, GH_USER_IDAuthFile } from "./auth_constants";
import { UIhelper } from "../../utils/UIhelper";
import { Common } from "../../utils/Common";

async function onceGithubLogin(userId: string, password: string, page: Page) {
  const uiHelper: UIhelper = new UIhelper(page);
  const githubLoginEmail: Locator = page.locator("#login_field");
  const githubLoginPassword: Locator = page.locator("#password");
  const githubLoginSignIn: Locator = page.locator('[value="Sign in"]');
  const githubLogin2ndFactor: Locator = page.locator("#app_totp");

  await page.goto("https://github.com/login");
  await githubLoginEmail.fill(userId);
  await githubLoginPassword.fill(password);
  await githubLoginSignIn.click();
  await githubLogin2ndFactor.fill(await getGitHub2FAOTP(userId));
  await page.waitForURL("https://github.com/");
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
  //with this, we ensure having always a new code, max is 30 seconds + 100ms to avoid race conditions
  //https://www.npmjs.com/package/otplib#getting-time-remaining--time-used
  await new Promise((resolve) =>
    setTimeout(resolve, authenticator.timeRemaining() * 1000 + 100),
  );
  return authenticator.generate(secret);
}

setup("authenticate as GH_USER_ID", async ({ page }) => {
  setup.setTimeout(80000);
  const userId = process.env.GH_USER_ID;
  const password = process.env.GH_USER_PASS;
  await onceGithubLogin(userId, password, page);
  await page.context().storageState({ path: GH_USER_IDAuthFile });
});

setup("authenticate as GH_USER2_ID", async ({ page }) => {
  setup.setTimeout(80000);
  const userId = process.env.GH_USER2_ID;
  const password = process.env.GH_USER2_PASS;
  await onceGithubLogin(userId, password, page);
  await page.context().storageState({ path: GH_USER2_IDAuthFile });
});
