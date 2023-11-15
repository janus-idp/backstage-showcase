import {
  BackstageShowcase,
  CatalogImport,
} from '../support/pages/CatalogImport';
import { Common } from '../utils/Common';
import { UIhelper } from '../utils/UIhelper';

describe('GitHub Happy path', () => {
  const component =
    'https://github.com/janus-idp/backstage-showcase/blob/main/catalog-entities/all.yaml';

  const resources = [
    'Janus-IDP Authors',
    'Janus-IDP',
    'ArgoCD',
    'GitHub Showcase repository',
    'KeyCloak',
    'S3 Object bucket storage',
    'PostgreSQL cluster',
  ];

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

  it('Click login on the login popup and verify that Overview tab renders', () => {
    UIhelper.selectMuiBox('Kind', 'Component');
    UIhelper.clickLink('Backstage Showcase');
    Common.clickOnGHloginPopup();
    UIhelper.verifyLink('Janus Website', { contains: true });
    BackstageShowcase.verifyPRStatisticsRendered();
    BackstageShowcase.verifyAboutCardIsDisplayed();
  });

  it('Verify that the Issues tab renders all the open github issues in the repository', () => {
    UIhelper.clickTab('Issues');
    BackstageShowcase.getGithubOpenIssues().then(openIssues => {
      cy.contains(`All repositories (${openIssues.length} Issues)*`);
      openIssues.slice(0, 5).forEach(issue => {
        cy.contains(issue.title).should('be.visible');
      });
    });
  });

  it('Verify that the Pull/Merge Requests tab renders the 5 most recently updated Open Pull Requests', () => {
    UIhelper.clickTab('Pull/Merge Requests');
    BackstageShowcase.getGithubPRs('open').then(openPRs => {
      BackstageShowcase.verifyPRRows(openPRs, 0, 5);
    });
  });

  it('Click on the CLOSED filter and verify that the 5 most recently updated Closed PRs are rendered (same with ALL)', () => {
    UIhelper.clickButton('CLOSED', { force: true });
    BackstageShowcase.getGithubPRs('closed').then(closedPRs => {
      closedPRs.slice(0, 5).forEach(closedPR => {
        cy.contains(closedPR.title).should('be.visible');
      });
    });
  });

  it('Click on the arrows to verify that the next/previous/first/last pages of PRs are loaded', () => {
    BackstageShowcase.getGithubPRs('all', true).then(allPRs => {
      UIhelper.clickButton('ALL', { force: true });
      BackstageShowcase.verifyPRRows(allPRs, 0, 5);

      BackstageShowcase.clickNextPage();
      BackstageShowcase.verifyPRRows(allPRs, 5, 10);

      const lastPagePRs = Math.floor(allPRs.length / 5) * 5;

      BackstageShowcase.clickLastPage();
      BackstageShowcase.verifyPRRows(allPRs, lastPagePRs, allPRs.length);

      BackstageShowcase.clickPreviousPage();
      BackstageShowcase.verifyPRRows(allPRs, lastPagePRs - 5, lastPagePRs);
    });
  });

  it('Verify that the 5, 10, 20 items per page option properly displays the correct number of PRs', () => {
    BackstageShowcase.getGithubPRs('all').then(allPRs => {
      BackstageShowcase.clickFirstPage();
      BackstageShowcase.verifyPRRowsPerPage(5, allPRs);
      BackstageShowcase.verifyPRRowsPerPage(10, allPRs);
      BackstageShowcase.verifyPRRowsPerPage(20, allPRs);
    });
  });

  it('Verify that the CI tab renders 5 most recent github actions and verify the table properly displays the actions when page sizes are changed and filters are applied', () => {
    UIhelper.clickTab('CI');
    Common.clickOnGHloginPopup();
    BackstageShowcase.getWorkflowRuns().then(workflowRuns => {
      workflowRuns.slice(0, 5).forEach(workflowRun => {
        cy.contains(workflowRun.id).should('be.visible');
      });
    });
  });

  it('Click on the Dependencies tab and verify that all the relations have been listed and displayed', () => {
    UIhelper.clickTab('Dependencies');
    resources.forEach(resource => {
      cy.get('#workspace').contains(resource).scrollIntoView();
      cy.get('#workspace').contains(resource).should('be.visible');
    });
  });

  // it("Navigate to Create... and create a new component using the ____ template", () => {
  // });
  it('Sign out and verify that you return back to the Sign in page', () => {
    UIhelper.openSidebar('Settings');
    Common.signOut();
  });
});
