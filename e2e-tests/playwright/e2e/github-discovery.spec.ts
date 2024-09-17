import { expect, test as base } from '@playwright/test';
import { Catalog } from '../support/pages/Catalog';
import GithubApi from '../support/api/github';
import { CatalogItem } from '../support/pages/catalog-item';
import { JANUS_QE_ORG } from '../utils/constants';
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
    const reposNames: string[] = organizationRepos.map(e => e['name']);
    // some repos may not be Components, so let's check
    let pass = 0;

    for (let i = 0; i != reposNames.length; i++) {
      const repo = reposNames[i];

      await catalogPage.search(repo);
      const row = await catalogPage.tableRow(repo);
      if (await row.isVisible()) {
        await row.click();
        await catalogItem.validateGithubLink(`${testOrganization}/${repo}`);
        await page.goBack();
        pass++;
      }
    }
    //At least 1/5 are valid and listed components
    expect(pass).toBeGreaterThanOrEqual(organizationRepos.length / 5);
  });
});
