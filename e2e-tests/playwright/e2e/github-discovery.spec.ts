import { test as base } from '@playwright/test';
import { Catalog } from '../support/pages/Catalog';
import GithubApi from '../support/api/github';
import { CatalogItem } from '../support/pages/catalog-item';
import { CATALOG_FILE, JANUS_QE_ORG } from '../utils/constants';
import { Common } from '../utils/Common';

type GithubDiscoveryFixture = {
  catalogPage: Catalog;
  catalogItem: CatalogItem;
  testOrganization: string;
};

const test = base.extend<GithubDiscoveryFixture>({
  catalogPage: async ({ page }, use) => {
    await new Common(page).loginAsGithubUser();
    const catalog = new Catalog(page);
    await catalog.go();
    use(catalog);
  },
  catalogItem: async ({ page }, use) => {
    const catalogItem = new CatalogItem(page);
    use(catalogItem);
  },
  testOrganization: JANUS_QE_ORG,
});

test.describe('Github Discovery Catalog', () => {
  test(`Discover Organization's Catalog`, async ({
    catalogPage,
    catalogItem,
    testOrganization,
    page,
  }) => {
    const organizationRepos = await new GithubApi().getReposFromOrg(
      testOrganization,
    );
    const reposNames: string[] = organizationRepos.map(repo => repo['name']);
    const realComponents: string[] = reposNames.filter(
      async repo =>
        await new GithubApi().fileExistsOnRepo(
          `${testOrganization}/${repo}`,
          CATALOG_FILE,
        ),
    );

    for (let i = 0; i != realComponents.length; i++) {
      const repo = realComponents[i];

      await catalogPage.search(repo);
      const row = await catalogPage.tableRow(repo);
      if (await row.isVisible()) {
        await row.click();
        await catalogItem.validateGithubLink(`${testOrganization}/${repo}`);
        await page.goBack();
      }
    }
  });
});
