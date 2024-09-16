import { expect, test } from '@playwright/test';
import { env } from 'process';
import { Common } from '../utils/Common';
import { Catalog } from '../support/pages/Catalog';
import GithubApi from '../support/api/github';
import { CatalogItem } from '../support/pages/catalog-item';

test.describe('Github discovery UI tests', () => {
  let common: Common;
  let catalog: Catalog;

  test.beforeEach(async ({ page }) => {
    common = new Common(page);
    await common.loginAsGithubUser();
    catalog = new Catalog(page);
    await catalog.go();
  });

  test(`Discover Organization's Catalog`, async ({ page }) => {
    const organizationRepos = await new GithubApi().getReposFromOrg(
      env.GITHUB_ORG,
    );
    const reposNames: string[] = organizationRepos.map(e => e['name']);
    // some repos may not be Components, so let's check
    let fail = 0;
    let pass = 0;

    for (let i = 0; i != reposNames.length; i++) {
      const repo = reposNames[i];

      await catalog.search(repo);
      const row = await catalog.tableRow(repo);
      if (await row.isVisible()) {
        await row.click();
        const component = new CatalogItem(page);
        await component.validateGithubLink(`${env.GITHUB_ORG}/${repo}`);
        await page.goBack();
        pass++;
      } else {
        fail++;
      }
    }

    console.log('Valid and Listed components: ' + pass);
    console.log('Ignored components: ' + fail);
    //At least 1/4 are valid and listed components
    expect(pass).toBeGreaterThanOrEqual(organizationRepos.length / 4);
  });
});
