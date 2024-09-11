import { expect, Page, test } from '@playwright/test';
import { UIhelper } from '../../utils/UIhelper';
import { Common, setupBrowser } from '../../utils/Common';
import { APIHelper } from '../../utils/APIHelper';
import { BulkImport } from '../../support/pages/BulkImport';
import { BackstageShowcase } from '../../support/pages/CatalogImport';
import {
  defaultCatalogInfoYaml,
  updatedCatalogInfoYaml,
} from '../../support/testData/BulkImport';

// NOTE : /dynamic-plugins/dist/backstage-plugin-catalog-backend-module-github-org-dynamic should not have org janus-test configured.
let page: Page;
test.describe.serial('Bulk Import plugin', () => {
  let uiHelper: UIhelper;
  let common: Common;
  let bulkimport: BulkImport;
  let backstageShowcase: BackstageShowcase;
  const repo1 = {
    name: 'bulk-import-test-1',
    url: 'github.com/janus-qe/bulk-import-test-1',
    org: 'github.com/janus-qe',
    owner: 'janus-qe',
  };
  const newRepoDetails = {
    owner: 'janus-test',
    repoName: `janus-test-2-bulk-import-test`,
    updatedComponentName: `janus-test-2-bulk-import-test-updated`,
    labels: `bulkimport1: test1;bulkimport2: test2`,
  };
  test.beforeAll(async ({ browser }, testInfo) => {
    page = (await setupBrowser(browser, testInfo)).page;

    uiHelper = new UIhelper(page);
    common = new Common(page);
    bulkimport = new BulkImport(page);
    backstageShowcase = new BackstageShowcase(page);
    await bulkimport.newGitHubRepo(
      newRepoDetails.owner,
      newRepoDetails.repoName,
    );
    await common.loginAsGithubUser();
  });

  // Select two repos: one with an existing catalog.yaml file and another without it
  test('Add a Repository from the Repository Tab and Confirm its Preview', async () => {
    await uiHelper.openSidebar('Bulk import');
    await uiHelper.clickButton('Add');
    await backstageShowcase.selectRowsPerPage(100);
    await uiHelper.searchInputPlaceholder(repo1.name);
    await uiHelper.verifyRowInTableByUniqueText(repo1.name, ['Not Generated']);
    await bulkimport.selectRepoInTable(repo1.name);
    await uiHelper.verifyRowInTableByUniqueText(repo1.name, [
      repo1.url,
      'Ready Preview file',
    ]);

    await uiHelper.clickOnLinkInTableByUniqueText(repo1.name, 'Preview file');
    await uiHelper.clickButton('Save');
  });

  test('Add a Repository from the Organization Tab and Confirm its Preview', async () => {
    await uiHelper.clickByDataTestId('organization-view');
    await uiHelper.searchInputPlaceholder(newRepoDetails.owner);
    await uiHelper.verifyRowInTableByUniqueText(newRepoDetails.owner, [
      new RegExp(`github.com/${newRepoDetails.owner}`),
      /1\/(\d+) Edit/,
      /Ready Preview file/,
    ]);
    await uiHelper.clickOnLinkInTableByUniqueText(newRepoDetails.owner, 'Edit');
    await backstageShowcase.selectRowsPerPage(100);
    await bulkimport.searchInOrg(newRepoDetails.repoName);
    await bulkimport.selectRepoInTable(newRepoDetails.repoName);
    await uiHelper.clickButton('Select');
    await uiHelper.verifyRowInTableByUniqueText(newRepoDetails.owner, [
      new RegExp(`github.com/${newRepoDetails.owner}`),
      /2\/(\d+) Edit/,
      /Ready Preview files/,
    ]);
    await uiHelper.clickButton('Create pull requests');
  });

  test('Verify that the two selected repositories are listed: one with the status "Added" and another with the status "WAIT_PR_APPROVAL."', async () => {
    await bulkimport.filterAddedRepo(repo1.name);
    await uiHelper.verifyRowInTableByUniqueText(repo1.name, [
      repo1.url,
      'Added',
    ]);
    await bulkimport.filterAddedRepo(newRepoDetails.repoName);
    await uiHelper.verifyRowInTableByUniqueText(newRepoDetails.repoName, [
      'Waiting for Approval',
    ]);
  });

  test('Verify the Content of catalog-info.yaml in the PR is Correct', async () => {
    const prCatalogInfoYaml = await APIHelper.getfileContentFromPR(
      newRepoDetails.owner,
      newRepoDetails.repoName,
      1,
      'catalog-info.yaml',
    );
    const expectedCatalogInfoYaml = defaultCatalogInfoYaml(
      newRepoDetails.repoName,
      `${newRepoDetails.owner}/${newRepoDetails.repoName}`,
      process.env.GH_USER_ID,
    );
    expect(prCatalogInfoYaml).toEqual(expectedCatalogInfoYaml);
  });

  test('Edit Pull request Details and Ensure PR Content Reflects Changes', async () => {
    await bulkimport.filterAddedRepo(newRepoDetails.repoName);
    await uiHelper.clickOnButtonInTableByUniqueText(
      newRepoDetails.repoName,
      'Update',
    );

    await uiHelper.fillTextInputByLabel(
      'Name of the created component',
      newRepoDetails.updatedComponentName,
    );
    await uiHelper.fillTextInputByLabel('Labels', newRepoDetails.labels);
    await uiHelper.clickButton('Save');

    const prCatalogInfoYaml = await APIHelper.getfileContentFromPR(
      newRepoDetails.owner,
      newRepoDetails.repoName,
      1,
      'catalog-info.yaml',
    );
    const expectedCatalogInfoYaml = updatedCatalogInfoYaml(
      newRepoDetails.updatedComponentName,
      `${newRepoDetails.owner}/${newRepoDetails.repoName}`,
      newRepoDetails.labels,
      process.env.GH_USER_ID,
    );
    expect(prCatalogInfoYaml).toEqual(expectedCatalogInfoYaml);
  });

  test("Merge the PR on GitHub and Confirm the Status Updates to 'Added'", async () => {
    // Merge PR is generated for the repository without the catalog.yaml file.
    await APIHelper.mergeGitHubPR(
      newRepoDetails.owner,
      newRepoDetails.repoName,
      1,
    );
    // Ensure that no PR is generated for the repository that already has a catalog.yaml file.
    expect(
      await APIHelper.getGitHubPRs(repo1.owner, repo1.name, 'open'),
    ).toHaveLength(0);

    await bulkimport.filterAddedRepo(newRepoDetails.repoName);
    // verify that the status has changed to "ADDED."
    await uiHelper.clickOnButtonInTableByUniqueText(
      newRepoDetails.repoName,
      'Refresh',
    );
    await uiHelper.verifyRowInTableByUniqueText(newRepoDetails.repoName, [
      'Added',
    ]);
  });

  test('Verify Added Repositories Appear in the Catalog as Expected', async () => {
    await uiHelper.verifyComponentInCatalog('Component', [
      newRepoDetails.updatedComponentName,
    ]);
  });

  test("Delete a Repository and Verify It's No Longer Visible in the UI", async () => {
    await uiHelper.openSidebar('Bulk import');
    await uiHelper.searchInputPlaceholder(newRepoDetails.repoName);
    await uiHelper.clickByDataTestId('delete-repository');
    await page.getByRole('button', { name: 'Remove' }).click();
  });
});
