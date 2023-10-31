import { CatalogImport } from '../support/pages/CatalogImport';
import { Common } from '../utils/Common';
import { UIhelper } from '../utils/UIhelper';

describe('Test with Guest Sign-in', () => {
  const component =
    'https://github.com/janus-idp/backstage-showcase/blob/main/catalog-entities/all.yaml';

  before(() => {
    Common.loginAsGithubUser();
  });

  it('Verify Profile is Github Account Name in the Settings page', () => {
    UIhelper.openSidebar('Settings');
    UIhelper.verifyHeading(Cypress.env('GH_USER_ID'));
    UIhelper.verifyHeading(
      `User Entity: user:default/${Cypress.env('GH_USER_ID')}`,
    );
  });

  it('Register an existing component', () => {
    UIhelper.openSidebar('Catalog');
    UIhelper.selectMuiBox('Kind', 'Component');
    UIhelper.clickButton('Create');
    UIhelper.clickButton('Register Existing Component');
    CatalogImport.registerExistingComponent(component);
  });

  it('Verify that the following components were ingested into the Catalog', () => {
    UIhelper.openSidebar('Catalog');

    UIhelper.selectMuiBox('Kind', 'API');
    UIhelper.verifyRowsInTable(['Petstore']);

    UIhelper.selectMuiBox('Kind', 'Component');
    UIhelper.verifyRowsInTable(['Backstage Showcase']);

    UIhelper.selectMuiBox('Kind', 'Group');
    UIhelper.verifyRowsInTable(['Janus-IDP Authors']);

    UIhelper.selectMuiBox('Kind', 'Resource');
    UIhelper.verifyRowsInTable([
      'ArgoCD',
      'GitHub Showcase repository',
      'KeyCloak',
      'PostgreSQL cluster',
      'S3 Object bucket storage',
    ]);

    UIhelper.selectMuiBox('Kind', 'System');
    UIhelper.verifyRowsInTable(['Janus-IDP']);

    UIhelper.selectMuiBox('Kind', 'User');
    UIhelper.verifyRowsInTable([
      'subhashkhileri',
      'josephca',
      'gustavolira',
      'rhdh-qe',
    ]);
  });
});
