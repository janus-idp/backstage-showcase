import { test } from '@playwright/test';
import { GithubApi } from '../../../support/api/github';
import { Common } from '../../../utils/Common';
import { Catalog } from '../../../support/pages/Catalog';

test.describe('Github discovery UI tests', () => {
  let common: Common;
  let catalog: Catalog;

  test.beforeEach(async ({ page }) => {
    common = new Common(page);
    await common.loginAsGithubUser();
    await catalog.go();
  });

  test(`Discover Organization's Catalog`, async () => {
    const organizationRepos = await new GithubApi()
      .organization('janus-qe')
      .repos();
    const reposNames: string[] = organizationRepos.map(e => e['name']);
    catalog.search(reposNames[0]);
  });
});
