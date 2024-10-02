import { expect, test as base } from '@playwright/test';
import { UIhelper } from '../../utils/UIhelper';
import { Common } from '../../utils/Common';
import { APIHelper } from '../../utils/APIHelper';
import { BulkImportPage } from '../../support/pages/BulkImport';
import { CatalogImport } from '../../support/pages/CatalogImport';
import {
  defaultCatalogInfoYaml,
  updatedCatalogInfoYaml,
} from '../../support/testData/BulkImport';

type BulkImportFixture = {
  uiHelper: UIhelper;
  common: Common;
  catalogImport: CatalogImport;
  bulkImport: {
    bulkImportPage: BulkImportPage;
    newRepoDetails: {
      owner: string;
      repoName: string;
      updatedComponentName: string;
      labels: string;
      repoUrl: string;
    };
  };
};

const test = base.extend<BulkImportFixture>({
  uiHelper: async ({ page }, use) => use(new UIhelper(page)),
  common: async ({ page }, use) => {
    const common = new Common(page);
    await common.loginAsGithubUser(process.env.GH_USER2_ID);
    use(common);
  },
  bulkImport: async ({ page }, use) => {
    const newRepoName = `bulk-import-${Date.now()}`;
    const newRepoDetails = {
      owner: 'janus-test',
      repoName: newRepoName,
      updatedComponentName: `${newRepoName}-updated`,
      labels: `bulkimport1: test1;bulkimport2: test2`,
      repoUrl: `github.com/janus-test/${newRepoName}`,
    };
    const bulkImportPage = new BulkImportPage(page);
    await bulkImportPage.newGitHubRepo(
      newRepoDetails.owner,
      newRepoDetails.repoName,
    );
    use({ bulkImportPage: bulkImportPage, newRepoDetails });
    await APIHelper.deleteGitHubRepo(
      newRepoDetails.owner,
      newRepoDetails.repoName,
    );
  },
  catalogImport: async ({ page }, use) => use(new CatalogImport(page)),
});

// Pre-req : plugin-bulk-import & plugin-bulk-import-backend-dynamic
test.describe.serial('Bulk Import plugin', () => {
  const catalogRepoDetails = {
    name: 'janus-test-1-bulk-import-test',
    url: 'github.com/janus-test/janus-test-1-bulk-import-test',
    org: 'github.com/janus-test',
    owner: 'janus-test',
  };

  // Select two repos: one with an existing catalog.yaml file and another without it
  test('Add a Repository from the Repository Tab and Confirm its Preview', async ({
    uiHelper,
    bulkImport: bulkimport,
  }) => {
    await uiHelper.openSidebar('Bulk import');
    await uiHelper.clickButton('Add');
    await uiHelper.searchInputPlaceholder(catalogRepoDetails.name);
    await uiHelper.verifyRowInTableByUniqueText(catalogRepoDetails.name, [
      'Not Generated',
    ]);
    await bulkimport.bulkImportPage.selectRepoInTable(catalogRepoDetails.name);
    await uiHelper.verifyRowInTableByUniqueText(catalogRepoDetails.name, [
      catalogRepoDetails.url,
      'Ready Preview file',
    ]);

    await uiHelper.clickOnLinkInTableByUniqueText(
      catalogRepoDetails.name,
      'Preview file',
    );
    await expect(await uiHelper.clickButton('Save')).not.toBeVisible();
  });

  test('Add a Repository from the Organization Tab and Confirm its Preview', async ({
    uiHelper,
    bulkImport: bulkimport,
  }) => {
    await uiHelper.clickByDataTestId('organization-view');
    await uiHelper.searchInputPlaceholder(bulkimport.newRepoDetails.owner);
    await uiHelper.verifyRowInTableByUniqueText(
      bulkimport.newRepoDetails.owner,
      [
        new RegExp(`github.com/${bulkimport.newRepoDetails.owner}`),
        /1\/(\d+) Edit/,
        /Ready Preview file/,
      ],
    );
    await uiHelper.clickOnLinkInTableByUniqueText(
      bulkimport.newRepoDetails.owner,
      'Edit',
    );
    await bulkimport.bulkImportPage.searchInOrg(
      bulkimport.newRepoDetails.repoName,
    );
    await bulkimport.bulkImportPage.selectRepoInTable(
      bulkimport.newRepoDetails.repoName,
    );
    await uiHelper.clickButton('Select');
    await uiHelper.verifyRowInTableByUniqueText(
      bulkimport.newRepoDetails.owner,
      [
        new RegExp(`github.com/${bulkimport.newRepoDetails.owner}`),
        /2\/(\d+) Edit/,
        /Ready Preview files/,
      ],
    );
    await expect(
      await uiHelper.clickButton('Create pull requests'),
    ).not.toBeVisible({ timeout: 10000 });
  });

  test('Verify that the two selected repositories are listed: one with the status "Added" and another with the status "WAIT_PR_APPROVAL."', async ({
    common,
    uiHelper,
    bulkImport: bulkimport,
  }) => {
    await common.waitForLoad();
    await bulkimport.bulkImportPage.filterAddedRepo(catalogRepoDetails.name);
    await uiHelper.verifyRowInTableByUniqueText(catalogRepoDetails.name, [
      catalogRepoDetails.url,
      'Added',
    ]);
    await bulkimport.bulkImportPage.filterAddedRepo(
      bulkimport.newRepoDetails.repoName,
    );
    await uiHelper.verifyRowInTableByUniqueText(
      bulkimport.newRepoDetails.repoName,
      ['Waiting for Approval'],
    );
  });

  test('Verify the Content of catalog-info.yaml in the PR is Correct', async ({
    bulkImport: bulkimport,
  }) => {
    const prCatalogInfoYaml = await APIHelper.getfileContentFromPR(
      bulkimport.newRepoDetails.owner,
      bulkimport.newRepoDetails.repoName,
      1,
      'catalog-info.yaml',
    );
    const expectedCatalogInfoYaml = defaultCatalogInfoYaml(
      bulkimport.newRepoDetails.repoName,
      `${bulkimport.newRepoDetails.owner}/${bulkimport.newRepoDetails.repoName}`,
      process.env.GH_USER2_ID,
    );
    expect(prCatalogInfoYaml).toEqual(expectedCatalogInfoYaml);
  });

  test('Edit Pull request Details and Ensure PR Content Reflects Changes', async ({
    bulkImport: bulkimport,
    uiHelper,
  }) => {
    await bulkimport.bulkImportPage.filterAddedRepo(
      bulkimport.newRepoDetails.repoName,
    );
    await uiHelper.clickOnButtonInTableByUniqueText(
      bulkimport.newRepoDetails.repoName,
      'Update',
    );

    await bulkimport.bulkImportPage.fillTextInputByNameAtt(
      'componentName',
      bulkimport.newRepoDetails.updatedComponentName,
    );
    await bulkimport.bulkImportPage.fillTextInputByNameAtt(
      'prLabels',
      bulkimport.newRepoDetails.labels,
    );
    await expect(await uiHelper.clickButton('Save')).not.toBeVisible();

    const prCatalogInfoYaml = await APIHelper.getfileContentFromPR(
      bulkimport.newRepoDetails.owner,
      bulkimport.newRepoDetails.repoName,
      1,
      'catalog-info.yaml',
    );
    const expectedCatalogInfoYaml = updatedCatalogInfoYaml(
      bulkimport.newRepoDetails.updatedComponentName,
      `${bulkimport.newRepoDetails.owner}/${bulkimport.newRepoDetails.repoName}`,
      bulkimport.newRepoDetails.labels,
      process.env.GH_USER2_ID,
    );
    expect(prCatalogInfoYaml).toEqual(expectedCatalogInfoYaml);
  });

  test("Verify Selected repositories shows catalog-info.yaml status as 'Added' and 'WAIT_PR_APPROVAL'", async ({
    uiHelper,
    bulkImport: bulkimport,
  }) => {
    await uiHelper.openSidebar('Bulk import');
    await uiHelper.clickButton('Add');
    await uiHelper.searchInputPlaceholder(catalogRepoDetails.name);
    await uiHelper.verifyRowInTableByUniqueText(catalogRepoDetails.name, [
      'Added',
    ]);
    await uiHelper.searchInputPlaceholder(bulkimport.newRepoDetails.repoName);
    await uiHelper.verifyRowInTableByUniqueText(
      bulkimport.newRepoDetails.repoName,
      ['Waiting for Approval'],
    );
  });

  test("Merge the PR on GitHub and Confirm the Status Updates to 'Added'", async ({
    uiHelper,
    bulkImport: bulkimport,
  }) => {
    await uiHelper.openSidebar('Bulk import');
    // Merge PR is generated for the repository without the catalog.yaml file.
    await APIHelper.mergeGitHubPR(
      bulkimport.newRepoDetails.owner,
      bulkimport.newRepoDetails.repoName,
      1,
    );
    // Ensure that no PR is generated for the repository that already has a catalog.yaml file.
    expect(
      await APIHelper.getGitHubPRs(
        catalogRepoDetails.owner,
        catalogRepoDetails.name,
        'open',
      ),
    ).toHaveLength(0);

    await bulkimport.bulkImportPage.filterAddedRepo(
      bulkimport.newRepoDetails.repoName,
    );
    // verify that the status has changed to "ADDED."
    await uiHelper.clickOnButtonInTableByUniqueText(
      bulkimport.newRepoDetails.repoName,
      'Refresh',
    );
    await uiHelper.verifyRowInTableByUniqueText(
      bulkimport.newRepoDetails.repoName,
      ['Added'],
    );
  });

  test('Verify Added Repositories Appear in the Catalog as Expected', async ({
    uiHelper,
  }) => {
    await uiHelper.openSidebar('Catalog');
    await uiHelper.selectMuiBox('Kind', 'Component');
    await uiHelper.searchInputPlaceholder(catalogRepoDetails.name);
    await uiHelper.verifyRowInTableByUniqueText(catalogRepoDetails.name, [
      'other',
      'unknown',
    ]);
  });

  test("Delete a Bulk Import Repository and Verify It's No Longer Visible in the UI", async ({
    page,
    uiHelper,
    common,
    bulkImport: bulkimport,
  }) => {
    await uiHelper.openSidebar('Bulk import');
    await common.waitForLoad();
    await bulkimport.bulkImportPage.filterAddedRepo(catalogRepoDetails.name);
    await uiHelper.clickOnButtonInTableByUniqueText(
      catalogRepoDetails.name,
      'Delete',
    );
    await page.getByRole('button', { name: 'Remove' }).click();
    await uiHelper.verifyLink(catalogRepoDetails.url, {
      exact: false,
      notVisible: true,
    });
  });

  test('Verify Deleted Bulk Import Repositories Does not Appear in the Catalog', async ({
    uiHelper,
  }) => {
    await uiHelper.openSidebar('Catalog');
    await uiHelper.selectMuiBox('Kind', 'Component');
    await uiHelper.searchInputPlaceholder(catalogRepoDetails.name);
    await uiHelper.verifyLink(catalogRepoDetails.name, {
      notVisible: true,
    });
  });
});

test.describe
  .serial('Bulk Import - Verify existing repo are displayed in bulk import Added repositories', () => {
  const existingRepoFromAppConfig = 'janus-test-3-bulk-import';

  const existingComponentDetails = {
    name: 'janus-test-2-bulk-import-test',
    repoName: 'janus-test-2-bulk-import-test',
    url: 'https://github.com/janus-test/janus-test-2-bulk-import-test/blob/main/catalog-info.yaml',
  };

  test('Verify existing repo from app-config is displayed in bulk import Added repositories', async ({
    uiHelper,
    common,
    bulkImport: bulkimport,
  }) => {
    await uiHelper.openSidebar('Bulk import');
    await common.waitForLoad();
    await bulkimport.bulkImportPage.filterAddedRepo(existingRepoFromAppConfig);
    await uiHelper.verifyRowInTableByUniqueText(existingRepoFromAppConfig, [
      'Added',
    ]);
  });

  test('Verify repo from "register existing component"  are displayed in bulk import Added repositories', async ({
    uiHelper,
    catalogImport,
    common,
    bulkImport,
  }) => {
    // Register Existing Component
    await uiHelper.openSidebar('Catalog');
    await uiHelper.clickButton('Create');
    await uiHelper.clickButton('Register Existing Component');
    await catalogImport.registerExistingComponent(
      existingComponentDetails.url,
      true,
    );

    // Verify in bulk import's Added Repositories
    await uiHelper.openSidebar('Bulk import');
    await common.waitForLoad();
    await bulkImport.bulkImportPage.filterAddedRepo(
      existingComponentDetails.repoName,
    );
    await uiHelper.verifyRowInTableByUniqueText(
      existingComponentDetails.repoName,
      ['Added'],
    );
  });
});

test.describe
  .serial('Bulk Import - Ensure users without bulk import permissions cannot access the bulk import plugin', () => {
  test('Bulk Import - Verify users without permission cannot access', async ({
    uiHelper,
  }) => {
    await uiHelper.openSidebar('Bulk import');
    await uiHelper.verifyText('Permission required');
    expect(await uiHelper.isBtnVisible('Add')).toBeFalsy();
  });
});
