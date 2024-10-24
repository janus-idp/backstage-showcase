import { expect, Page, test } from "@playwright/test";
import { UIhelper } from "../../utils/UIhelper";
import { Common, setupBrowser } from "../../utils/Common";
import { APIHelper } from "../../utils/APIHelper";
import { BulkImport } from "../../support/pages/BulkImport";
import { CatalogImport } from "../../support/pages/CatalogImport";
import {
  defaultCatalogInfoYaml,
  updatedCatalogInfoYaml,
} from "../../support/testData/BulkImport";
import {
  GH_USER2_IDAuthFile,
  GH_USER_IDAuthFile,
} from "../../support/auth/auth_constants";

// Pre-req : plugin-bulk-import & plugin-bulk-import-backend-dynamic
test.describe.serial("Bulk Import plugin", () => {
  test.use({ storageState: GH_USER2_IDAuthFile });

  let page: Page;
  let uiHelper: UIhelper;
  let common: Common;
  let bulkimport: BulkImport;

  const catalogRepoDetails = {
    name: "janus-test-1-bulk-import-test",
    url: "github.com/janus-test/janus-test-1-bulk-import-test",
    org: "github.com/janus-test",
    owner: "janus-test",
  };
  const newRepoName = `bulk-import-${Date.now()}`;
  const newRepoDetails = {
    owner: "janus-test",
    repoName: newRepoName,
    updatedComponentName: `${newRepoName}-updated`,
    labels: `bulkimport1: test1;bulkimport2: test2`,
    repoUrl: `github.com/janus-test/${newRepoName}`,
  };

  test.beforeAll(async () => {
    await bulkimport.newGitHubRepo(
      newRepoDetails.owner,
      newRepoDetails.repoName,
    );
  });

  test.beforeEach(async ({ page }) => {
    uiHelper = new UIhelper(page);
    common = new Common(page);
    bulkimport = new BulkImport(page);
    await new Common(page).logintoGithub();
  });

  // Select two repos: one with an existing catalog.yaml file and another without it
  test("Add a Repository from the Repository Tab and Confirm its Preview", async () => {
    await uiHelper.openSidebar("Bulk import");
    await uiHelper.clickButton("Add");
    await uiHelper.searchInputPlaceholder(catalogRepoDetails.name);
    await uiHelper.verifyRowInTableByUniqueText(catalogRepoDetails.name, [
      "Not Generated",
    ]);
    await bulkimport.selectRepoInTable(catalogRepoDetails.name);
    await uiHelper.verifyRowInTableByUniqueText(catalogRepoDetails.name, [
      catalogRepoDetails.url,
      "Ready Preview file",
    ]);

    await uiHelper.clickOnLinkInTableByUniqueText(
      catalogRepoDetails.name,
      "Preview file",
    );
    await expect(await uiHelper.clickButton("Save")).not.toBeVisible();
  });

  test("Add a Repository from the Organization Tab and Confirm its Preview", async () => {
    await uiHelper.clickByDataTestId("organization-view");
    await uiHelper.searchInputPlaceholder(newRepoDetails.owner);
    await uiHelper.verifyRowInTableByUniqueText(newRepoDetails.owner, [
      new RegExp(`github.com/${newRepoDetails.owner}`),
      /1\/(\d+) Edit/,
      /Ready Preview file/,
    ]);
    await uiHelper.clickOnLinkInTableByUniqueText(newRepoDetails.owner, "Edit");
    await bulkimport.searchInOrg(newRepoDetails.repoName);
    await bulkimport.selectRepoInTable(newRepoDetails.repoName);
    await uiHelper.clickButton("Select");
    await uiHelper.verifyRowInTableByUniqueText(newRepoDetails.owner, [
      new RegExp(`github.com/${newRepoDetails.owner}`),
      /2\/(\d+) Edit/,
      /Ready Preview files/,
    ]);
    await expect(
      await uiHelper.clickButton("Create pull requests"),
    ).not.toBeVisible({ timeout: 10000 });
  });

  test('Verify that the two selected repositories are listed: one with the status "Added" and another with the status "WAIT_PR_APPROVAL."', async () => {
    await common.waitForLoad();
    await bulkimport.filterAddedRepo(catalogRepoDetails.name);
    await uiHelper.verifyRowInTableByUniqueText(catalogRepoDetails.name, [
      catalogRepoDetails.url,
      "Added",
    ]);
    await bulkimport.filterAddedRepo(newRepoDetails.repoName);
    await uiHelper.verifyRowInTableByUniqueText(newRepoDetails.repoName, [
      "Waiting for Approval",
    ]);
  });

  test("Verify the Content of catalog-info.yaml in the PR is Correct", async () => {
    const prCatalogInfoYaml = await APIHelper.getfileContentFromPR(
      newRepoDetails.owner,
      newRepoDetails.repoName,
      1,
      "catalog-info.yaml",
    );
    const expectedCatalogInfoYaml = defaultCatalogInfoYaml(
      newRepoDetails.repoName,
      `${newRepoDetails.owner}/${newRepoDetails.repoName}`,
      process.env.GH_USER2_ID,
    );
    expect(prCatalogInfoYaml).toEqual(expectedCatalogInfoYaml);
  });

  test("Edit Pull request Details and Ensure PR Content Reflects Changes", async () => {
    await bulkimport.filterAddedRepo(newRepoDetails.repoName);
    await uiHelper.clickOnButtonInTableByUniqueText(
      newRepoDetails.repoName,
      "Update",
    );

    await bulkimport.fillTextInputByNameAtt(
      "componentName",
      newRepoDetails.updatedComponentName,
    );
    await bulkimport.fillTextInputByNameAtt("prLabels", newRepoDetails.labels);
    await expect(await uiHelper.clickButton("Save")).not.toBeVisible();

    const prCatalogInfoYaml = await APIHelper.getfileContentFromPR(
      newRepoDetails.owner,
      newRepoDetails.repoName,
      1,
      "catalog-info.yaml",
    );
    const expectedCatalogInfoYaml = updatedCatalogInfoYaml(
      newRepoDetails.updatedComponentName,
      `${newRepoDetails.owner}/${newRepoDetails.repoName}`,
      newRepoDetails.labels,
      process.env.GH_USER2_ID,
    );
    expect(prCatalogInfoYaml).toEqual(expectedCatalogInfoYaml);
  });

  test("Verify Selected repositories shows catalog-info.yaml status as 'Added' and 'WAIT_PR_APPROVAL'", async () => {
    await uiHelper.openSidebar("Bulk import");
    await uiHelper.clickButton("Add");
    await uiHelper.searchInputPlaceholder(catalogRepoDetails.name);
    await uiHelper.verifyRowInTableByUniqueText(catalogRepoDetails.name, [
      "Added",
    ]);
    await uiHelper.searchInputPlaceholder(newRepoDetails.repoName);
    await uiHelper.verifyRowInTableByUniqueText(newRepoDetails.repoName, [
      "Waiting for Approval",
    ]);
  });

  test("Merge the PR on GitHub and Confirm the Status Updates to 'Added'", async () => {
    await uiHelper.openSidebar("Bulk import");
    // Merge PR is generated for the repository without the catalog.yaml file.
    await APIHelper.mergeGitHubPR(
      newRepoDetails.owner,
      newRepoDetails.repoName,
      1,
    );
    // Ensure that no PR is generated for the repository that already has a catalog.yaml file.
    expect(
      await APIHelper.getGitHubPRs(
        catalogRepoDetails.owner,
        catalogRepoDetails.name,
        "open",
      ),
    ).toHaveLength(0);

    await bulkimport.filterAddedRepo(newRepoDetails.repoName);
    // verify that the status has changed to "ADDED."
    await uiHelper.clickOnButtonInTableByUniqueText(
      newRepoDetails.repoName,
      "Refresh",
    );
    await uiHelper.verifyRowInTableByUniqueText(newRepoDetails.repoName, [
      "Added",
    ]);
  });

  test("Verify Added Repositories Appear in the Catalog as Expected", async () => {
    await uiHelper.openSidebar("Catalog");
    await uiHelper.selectMuiBox("Kind", "Component");
    await uiHelper.searchInputPlaceholder(catalogRepoDetails.name);
    await uiHelper.verifyRowInTableByUniqueText(catalogRepoDetails.name, [
      "other",
      "unknown",
    ]);
  });

  test("Delete a Bulk Import Repository and Verify It's No Longer Visible in the UI", async () => {
    await uiHelper.openSidebar("Bulk import");
    await common.waitForLoad();
    await bulkimport.filterAddedRepo(catalogRepoDetails.name);
    await uiHelper.clickOnButtonInTableByUniqueText(
      catalogRepoDetails.name,
      "Delete",
    );
    await page.getByRole("button", { name: "Remove" }).click();
    await uiHelper.verifyLink(catalogRepoDetails.url, {
      exact: false,
      notVisible: true,
    });
  });

  test("Verify Deleted Bulk Import Repositories Does not Appear in the Catalog", async () => {
    await uiHelper.openSidebar("Catalog");
    await uiHelper.selectMuiBox("Kind", "Component");
    await uiHelper.searchInputPlaceholder(catalogRepoDetails.name);
    await uiHelper.verifyLink(catalogRepoDetails.name, {
      notVisible: true,
    });
  });

  test.afterAll(async () => {
    await APIHelper.deleteGitHubRepo(
      newRepoDetails.owner,
      newRepoDetails.repoName,
    );
  });
});

test.describe
  .serial("Bulk Import - Verify existing repo are displayed in bulk import Added repositories", () => {
  test.use({ storageState: GH_USER2_IDAuthFile });

  let uiHelper: UIhelper;
  let common: Common;
  let bulkimport: BulkImport;
  let catalogImport: CatalogImport;
  const existingRepoFromAppConfig = "janus-test-3-bulk-import";

  const existingComponentDetails = {
    name: "janus-test-2-bulk-import-test",
    repoName: "janus-test-2-bulk-import-test",
    url: "https://github.com/janus-test/janus-test-2-bulk-import-test/blob/main/catalog-info.yaml",
  };
  test.beforeEach(async ({ page }) => {
    uiHelper = new UIhelper(page);
    common = new Common(page);
    bulkimport = new BulkImport(page);
    catalogImport = new CatalogImport(page);
    await new Common(page).logintoGithub();
  });

  test("Verify existing repo from app-config is displayed in bulk import Added repositories", async () => {
    await uiHelper.openSidebar("Bulk import");
    await common.waitForLoad();
    await bulkimport.filterAddedRepo(existingRepoFromAppConfig);
    await uiHelper.verifyRowInTableByUniqueText(existingRepoFromAppConfig, [
      "Added",
    ]);
  });

  test('Verify repo from "register existing component"  are displayed in bulk import Added repositories', async () => {
    // Register Existing Component
    await uiHelper.openSidebar("Catalog");
    await uiHelper.clickButton("Create");
    await uiHelper.clickButton("Register Existing Component");
    await catalogImport.registerExistingComponent(
      existingComponentDetails.url,
      true,
    );

    // Verify in bulk import's Added Repositories
    await uiHelper.openSidebar("Bulk import");
    await common.waitForLoad();
    await bulkimport.filterAddedRepo(existingComponentDetails.repoName);
    await uiHelper.verifyRowInTableByUniqueText(
      existingComponentDetails.repoName,
      ["Added"],
    );
  });
});

test.describe
  .serial("Bulk Import - Ensure users without bulk import permissions cannot access the bulk import plugin", () => {
  test.use({ storageState: GH_USER_IDAuthFile });

  let page: Page;
  let uiHelper: UIhelper;
  test.beforeAll(async ({ browser }, testInfo) => {
    page = (await setupBrowser(browser, testInfo)).page;

    uiHelper = new UIhelper(page);
    await new Common(page).logintoGithub();
  });

  test("Bulk Import - Verify users without permission cannot access", async () => {
    await uiHelper.openSidebar("Bulk import");
    await uiHelper.verifyText("Permission required");
    expect(await uiHelper.isBtnVisible("Add")).toBeFalsy();
  });
});
