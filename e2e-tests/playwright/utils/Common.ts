import { UIhelper } from "./UIhelper";
import { authenticator } from "otplib";
import {
  Browser,
  BrowserContext,
  expect,
  Page,
  TestInfo,
} from "@playwright/test";
import { SettingsPagePO } from "../support/pageObjects/page-obj";
import { waitsObjs } from "../support/pageObjects/global-obj";
import path from "path";
import { GH_USER_IDAuthFile_github } from "../support/auth/auth_constants";
import fs from "fs";

export class Common {
  page: Page;
  uiHelper: UIhelper;

  constructor(page: Page) {
    this.page = page;
    this.uiHelper = new UIhelper(page);
  }

  public async logintoGithub(context: BrowserContext) {
    const sessionStorage = JSON.parse(
      fs.readFileSync(GH_USER_IDAuthFile_github, "utf-8"),
    );
    await context.addInitScript((storage) => {
      for (const [key, value] of Object.entries(storage))
        window.sessionStorage.setItem(key, value as string);
    }, sessionStorage);
    await this.page.goto("/settings");
    await this.page.waitForURL("/settings");
    await this.page.goto("/");
    await this.page.waitForURL("/");
  }

  public async loginAsGuest() {
    const uiHelper = new UIhelper(this.page);
    await this.page.goto("/");
    await this.page.waitForURL("/");
    await uiHelper.verifyHeading("Select a sign-in method");
    await uiHelper.clickButton("Enter");
    await uiHelper.waitForSideBarVisible();
  }

  async waitForLoad(timeout = 120000) {
    for (const item of Object.values(waitsObjs)) {
      await this.page.waitForSelector(item, {
        state: "hidden",
        timeout: timeout,
      });
    }
  }

  async signOut() {
    await this.page.click(SettingsPagePO.userSettingsMenu);
    await this.page.click(SettingsPagePO.signOut);
    await this.uiHelper.verifyHeading("Select a sign-in method");
  }

  async checkAndReauthorizeGithubApp() {
    await new Promise<void>((resolve) => {
      this.page.once("popup", async (popup) => {
        await popup.waitForLoadState();

        // Check for popup closure for up to 10 seconds before proceeding
        for (let attempts = 0; attempts < 10 && !popup.isClosed(); attempts++) {
          await this.page.waitForTimeout(1000); // Using page here because if the popup closes automatically, it throws an error during the wait
        }

        const locator = popup.locator("button.js-oauth-authorize-btn");
        if (!popup.isClosed() && (await locator.isVisible())) {
          await popup.locator("body").click();
          await locator.waitFor();
          await locator.click();
        }
        resolve();
      });
    });
  }

  async githubLogin(username: string, password: string) {
    await this.page.goto("/");
    await this.page.waitForSelector('p:has-text("Sign in using GitHub")');
    await this.uiHelper.clickButton("Sign In");

    return await new Promise<string>((resolve) => {
      this.page.once("popup", async (popup) => {
        await popup.waitForLoadState();
        if (popup.url().startsWith(process.env.BASE_URL)) {
          // an active rhsso session is already logged in and the popup will automatically close
          resolve("Already logged in");
        } else {
          await popup.waitForTimeout(3000);
          try {
            await popup.locator("#login_field").fill(username);
            await popup.locator("#password").fill(password);
            await popup.locator("[type='submit']").click({ timeout: 5000 });
            //await this.checkAndReauthorizeGithubApp()
            await popup.waitForEvent("close", { timeout: 2000 });
            resolve("Login successful");
          } catch (e) {
            const authorization = popup.locator(
              "button.js-oauth-authorize-btn",
            );
            if (await authorization.isVisible()) {
              authorization.click();
              resolve("Login successful with app authorization");
            } else {
              throw e;
            }
          }
        }
      });
    });
  }

  async googleSignIn(email: string) {
    await new Promise<void>((resolve) => {
      this.page.once("popup", async (popup) => {
        await popup.waitForLoadState();
        const locator = popup
          .getByRole("link", { name: email, exact: false })
          .first();
        await popup.waitForTimeout(3000);
        await locator.waitFor({ state: "visible" });
        await locator.click({ force: true });
        await popup.waitForTimeout(3000);

        await popup.locator("[name=Passwd]").fill(process.env.GOOGLE_USER_PASS);
        await popup.locator("[name=Passwd]").press("Enter");
        await popup.waitForTimeout(3500);
        await popup.locator("[name=totpPin]").fill(this.getGoogle2FAOTP());
        await popup.locator("[name=totpPin]").press("Enter");
        await popup
          .getByRole("button", { name: /Continue|Weiter/ })
          .click({ timeout: 60000 });
        resolve();
      });
    });
  }

  async clickOnGHloginPopup() {
    await this.uiHelper.clickButton("Log in");
    await this.checkAndReauthorizeGithubApp();
    await this.page.waitForSelector(this.uiHelper.getButtonSelector("Log in"), {
      state: "hidden",
      timeout: 100000,
    });
  }

  getGoogle2FAOTP(): string {
    const secret = process.env.GOOGLE_2FA_SECRET;
    return authenticator.generate(secret);
  }

  async keycloakLogin(username: string, password: string) {
    await this.page.goto("/");
    await this.page.waitForSelector('p:has-text("Sign in using OIDC")');
    await this.uiHelper.clickButton("Sign In");

    return await new Promise<string>((resolve) => {
      this.page.once("popup", async (popup) => {
        await popup.waitForLoadState();
        if (popup.url().startsWith(process.env.BASE_URL)) {
          // an active rhsso session is already logged in and the popup will automatically close
          resolve("Already logged in");
        } else {
          await popup.waitForTimeout(3000);
          try {
            await popup.locator("#username").fill(username);
            await popup.locator("#password").fill(password);
            await popup.locator("[name=login]").click({ timeout: 5000 });
            await popup.waitForEvent("close", { timeout: 2000 });
            resolve("Login successful");
          } catch (e) {
            const usernameError = popup.locator("id=input-error");
            if (await usernameError.isVisible()) {
              await popup.close();
              resolve("User does not exist");
            } else {
              throw e;
            }
          }
        }
      });
    });
  }

  async MicrosoftAzureLogin(username: string, password: string) {
    await this.page.goto("/");
    await this.page.waitForSelector('p:has-text("Sign in using Microsoft")');
    await this.uiHelper.clickButton("Sign In");

    return await new Promise<string>((resolve) => {
      this.page.once("popup", async (popup) => {
        await popup.waitForLoadState();
        if (popup.url().startsWith(process.env.BASE_URL)) {
          // an active microsoft session is already logged in and the popup will automatically close
          resolve("Already logged in");
        } else {
          try {
            await popup.locator("[name=loginfmt]").fill(username);
            await popup
              .locator('[type=submit]:has-text("Next")')
              .click({ timeout: 5000 });

            await popup.locator("[name=passwd]").fill(password);
            await popup
              .locator('[type=submit]:has-text("Sign in")')
              .click({ timeout: 5000 });
            await popup
              .locator('[type=button]:has-text("No")')
              .click({ timeout: 15000 });
            resolve("Login successful");
          } catch (e) {
            const usernameError = popup.locator("id=usernameError");
            if (await usernameError.isVisible()) {
              resolve("User does not exist");
            } else {
              throw e;
            }
          }
        }
      });
    });
  }

  async GetParentGroupDisplayed(): Promise<string[]> {
    await this.page.waitForSelector("p:has-text('Parent Group')");
    const parent = await this.page
      .locator("p:has-text('Parent Group')")
      .locator("..");
    const group = await parent.locator("a").allInnerTexts();
    return group;
  }

  async GetChildGroupsDisplayed(): Promise<string[]> {
    await this.page.waitForSelector("p:has-text('Child Groups')");
    const parent = await this.page
      .locator("p:has-text('Child Groups')")
      .locator("..");
    const groups = await parent.locator("a").allInnerTexts();
    return groups;
  }

  async GetMembersOfGroupDisplayed(): Promise<string[]> {
    await this.page.waitForSelector(`//div[contains(., "Members")]/..`);
    const membersCard = this.page
      .locator(
        `//div[contains(@class,'MuiCardHeader-root') and descendant::text()[contains(., "Members")] ]/.. // a[@data-testid='user-link']`,
      )
      .allInnerTexts();
    return membersCard;
  }

  async GoToGroupPageAndGetDisplayedData(groupDisplayName: string) {
    await this.page.goto(
      "/catalog?filters%5Bkind%5D=group&filters%5Buser%5D=all",
    );
    await expect(this.page.getByRole("heading", { level: 1 })).toHaveText(
      "My Org Catalog",
      { timeout: 10000 },
    );

    await this.uiHelper.clickLink(groupDisplayName);
    await this.uiHelper.verifyHeading(groupDisplayName);

    const childGroups = await this.GetChildGroupsDisplayed();
    const parentGroup = await this.GetParentGroupDisplayed();
    const groupMembers = await this.GetMembersOfGroupDisplayed();
    return {
      childGroups,
      parentGroup,
      groupMembers,
    };
  }

  async UnregisterUserEnittyFromCatalog(user: string) {
    await this.page.goto("/");
    await this.uiHelper.openSidebar("Catalog");
    await this.uiHelper.selectMuiBox("Kind", "User");
    await this.uiHelper.verifyHeading("All users");

    await this.uiHelper.clickLink(user);
    await this.uiHelper.verifyHeading(user);

    await this.uiHelper.clickUnregisterButtonForDisplayedEntity();
  }

  async UnregisterGroupEnittyFromCatalog(group: string) {
    await this.page.goto("/");
    await this.uiHelper.openSidebar("Catalog");
    await this.uiHelper.selectMuiBox("Kind", "Group");
    await this.uiHelper.verifyHeading("All groups");

    await this.uiHelper.clickLink(group);
    await this.uiHelper.verifyHeading(group);

    await this.uiHelper.clickUnregisterButtonForDisplayedEntity();
  }

  async CheckGroupIsShowingInCatalog(groups: string[]) {
    await this.page.goto(
      "/catalog?filters%5Bkind%5D=group&filters%5Buser%5D=all",
    );
    await expect(this.page.getByRole("heading", { level: 1 })).toHaveText(
      "My Org Catalog",
      { timeout: 10000 },
    );
    await this.uiHelper.verifyHeading("All groups");
    await this.uiHelper.verifyCellsInTable(groups);
  }

  async CheckUserIsShowingInCatalog(users: string[]) {
    await this.page.goto(
      "/catalog?filters%5Bkind%5D=user&filters%5Buser%5D=all",
    );
    await expect(this.page.getByRole("heading", { level: 1 })).toHaveText(
      "My Org Catalog",
      { timeout: 10000 },
    );
    await this.uiHelper.verifyHeading("All user");
    await this.uiHelper.verifyCellsInTable(users);
  }
}

export async function setupBrowser(browser: Browser, testInfo: TestInfo) {
  const context = await browser.newContext({
    recordVideo: {
      dir: `test-results/${path
        .parse(testInfo.file)
        .name.replace(".spec", "")}/${testInfo.titlePath[1]}`,
      size: { width: 1920, height: 1080 },
    },
  });
  const page = await context.newPage();
  return { page, context };
}
