import { UIhelper } from "./UIhelper";
import { authenticator } from "otplib";
import { Browser, expect, Page, TestInfo } from "@playwright/test";
import { SettingsPagePO } from "../support/pageObjects/page-obj";
import { waitsObjs } from "../support/pageObjects/global-obj";
import path from "path";

export class Common {
  page: Page;
  uiHelper: UIhelper;

  constructor(page: Page) {
    this.page = page;
    this.uiHelper = new UIhelper(page);
  }

  public async logintoGithub() {
    await this.page.goto("/settings");
    await this.page.waitForURL("/settings");
    await this.page.goto("/");
    await this.page.waitForURL("/");
  }

  public async loginAsGuest() {
    await this.page.goto("/");
    await this.page.waitForURL("/");
    await this.uiHelper.verifyHeading("Select a sign-in method");
    await this.uiHelper.clickButton("Enter");
    await this.uiHelper.waitForSideBarVisible();
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

  async handleLoginPopup(
    resolve: (value: string | PromiseLike<string>) => void,
    popup: Page,
    loginSteps: (popup: Page) => Promise<void>,
    errorHandler?: (popup: Page, e: any) => Promise<void>,
  ) {
    await popup.waitForLoadState();
    if (popup.url().startsWith(process.env.BASE_URL)) {
      resolve("Already logged in");
    } else {
      await popup.waitForTimeout(3000);
      try {
        await loginSteps(popup);
        await popup.waitForEvent("close", { timeout: 2000 });
        resolve("Login successful");
      } catch (e) {
        if (errorHandler) {
          await errorHandler(popup, e);
          resolve("Login successful with additional steps");
        } else {
          throw e;
        }
      }
    }
  }

  async login(
    signInMethodText: string,
    username: string,
    password: string,
    selectors: {
      usernameField: string;
      passwordField: string;
      submitButton: string;
      additionalSteps?: (popup: Page) => Promise<void>;
      errorHandler?: (popup: Page, e: any) => Promise<void>;
    },
  ) {
    await this.page.goto("/");
    await this.page.waitForSelector(
      `p:has-text("Sign in using ${signInMethodText}")`,
    );
    await this.uiHelper.clickButton("Sign In");

    return await new Promise<string>((resolve) => {
      this.page.once("popup", async (popup) => {
        await this.handleLoginPopup(
          resolve,
          popup,
          async (popup) => {
            await popup.locator(selectors.usernameField).fill(username);
            await popup.locator(selectors.passwordField).fill(password);
            await popup
              .locator(selectors.submitButton)
              .click({ timeout: 5000 });
            if (selectors.additionalSteps) {
              await selectors.additionalSteps(popup);
            }
          },
          selectors.errorHandler,
        );
      });
    });
  }

  async githubLogin(username: string, password: string) {
    return await this.login("GitHub", username, password, {
      usernameField: "#login_field",
      passwordField: "#password",
      submitButton: "[type='submit']",
      errorHandler: async (popup, e) => {
        const authorization = popup.locator("button.js-oauth-authorize-btn");
        if (await authorization.isVisible()) {
          await authorization.click();
        } else {
          throw e;
        }
      },
    });
  }

  async keycloakLogin(username: string, password: string) {
    return await this.login("OIDC", username, password, {
      usernameField: "#username",
      passwordField: "#password",
      submitButton: "[name=login]",
      errorHandler: async (popup, e) => {
        const usernameError = popup.locator("#input-error");
        if (await usernameError.isVisible()) {
          await popup.close();
          throw new Error("User does not exist");
        } else {
          throw e;
        }
      },
    });
  }

  async MicrosoftAzureLogin(username: string, password: string) {
    await this.page.goto("/");
    await this.page.waitForSelector('p:has-text("Sign in using Microsoft")');
    await this.uiHelper.clickButton("Sign In");

    return await new Promise<string>((resolve) => {
      this.page.once("popup", async (popup) => {
        await this.handleLoginPopup(
          resolve,
          popup,
          async (popup) => {
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
          },
          async (popup, e) => {
            const usernameError = popup.locator("#usernameError");
            if (await usernameError.isVisible()) {
              throw new Error("User does not exist");
            } else {
              throw e;
            }
          },
        );
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

  async GetGroupsDisplayed(groupType: string): Promise<string[]> {
    await this.page.waitForSelector(`p:has-text('${groupType}')`);
    const parent = this.page
      .locator(`p:has-text('${groupType}')`)
      .locator("..");
    const groups = await parent.locator("a").allInnerTexts();
    return groups;
  }

  async GetParentGroupDisplayed(): Promise<string[]> {
    return await this.GetGroupsDisplayed("Parent Group");
  }

  async GetChildGroupsDisplayed(): Promise<string[]> {
    return await this.GetGroupsDisplayed("Child Groups");
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

  private async UnregisterEntityFromCatalog(kind: string, entityName: string) {
    await this.page.goto("/");
    await this.uiHelper.openSidebar("Catalog");
    await this.uiHelper.selectMuiBox("Kind", kind);
    await this.uiHelper.verifyHeading(`All ${kind.toLowerCase()}s`);

    await this.uiHelper.clickLink(entityName);
    await this.uiHelper.verifyHeading(entityName);

    await this.uiHelper.clickUnregisterButtonForDisplayedEntity();
  }

  async UnregisterUserEntityFromCatalog(user: string) {
    await this.UnregisterEntityFromCatalog("User", user);
  }

  async UnregisterGroupEntityFromCatalog(group: string) {
    await this.UnregisterEntityFromCatalog("Group", group);
  }

  async CheckEntitiesAreShowingInCatalog(kind: string, entities: string[]) {
    await this.page.goto(
      `/catalog?filters%5Bkind%5D=${kind.toLowerCase()}&filters%5Buser%5D=all`,
    );
    await expect(this.page.getByRole("heading", { level: 1 })).toHaveText(
      "My Org Catalog",
      { timeout: 10000 },
    );
    await this.uiHelper.verifyHeading(`All ${kind.toLowerCase()}s`);
    await this.uiHelper.verifyCellsInTable(entities);
  }

  async CheckGroupIsShowingInCatalog(groups: string[]) {
    await this.CheckEntitiesAreShowingInCatalog("Group", groups);
  }

  async CheckUserIsShowingInCatalog(users: string[]) {
    await this.CheckEntitiesAreShowingInCatalog("User", users);
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
