import { Page } from "@playwright/test";
import { APIHelper } from "../../utils/api-helper";
import { UI_HELPER_ELEMENTS } from "../pageObjects/global-obj";

export class BulkImport {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async searchInOrg(searchText: string) {
    await this.page
      .getByTestId("search-in-organization")
      .getByPlaceholder("Search")
      .fill(searchText);
  }

  async filterAddedRepo(searchText: string) {
    await this.page.getByPlaceholder("Filter").fill(searchText);
  }

  async newGitHubRepo(owner: string, repoName: string) {
    await APIHelper.createGitHubRepo(owner, repoName);
    await APIHelper.initCommit(owner, repoName);
  }

  async selectRepoInTable(repoName: string) {
    await this.page
      .locator(UI_HELPER_ELEMENTS.rowByText(repoName))
      .getByRole("checkbox")
      .check();
  }

  async fillTextInputByNameAtt(label: string, text: string) {
    await this.page
      .locator(`input[name*="${label}"], textarea[name*="${label}"]`)
      .fill(text);
  }
}
