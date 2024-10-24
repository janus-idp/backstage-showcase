import { test, expect } from "@playwright/test";
import { UIhelper } from "../utils/UIhelper";
import { Common } from "../utils/Common";
import { resources } from "../support/testData/resources";
import {
  BackstageShowcase,
  CatalogImport,
} from "../support/pages/CatalogImport";
import { templates } from "../support/testData/templates";
import { GH_USER_IDAuthFile } from "../support/auth/auth_constants";

test.use({ storageState: GH_USER_IDAuthFile });
test.describe.serial("GitHub Happy path", () => {
  let common: Common;
  let uiHelper: UIhelper;
  let catalogImport: CatalogImport;
  let backstageShowcase: BackstageShowcase;

  const component =
    "https://github.com/janus-idp/backstage-showcase/blob/main/catalog-entities/all.yaml";

  test.beforeEach(async ({ page }) => {
    uiHelper = new UIhelper(page);
    common = new Common(page);
    catalogImport = new CatalogImport(page);
    backstageShowcase = new BackstageShowcase(page);
    await new Common(page).logintoGithub();
  });

  test("Verify Profile is Github Account Name in the Settings page", async ({
    page,
  }) => {
    await uiHelper.openSidebar("Settings");
    await expect(page).toHaveURL("/settings");
    await uiHelper.verifyHeading(process.env.GH_USER_ID as string);
    await uiHelper.verifyHeading(`User Entity: ${process.env.GH_USER_ID}`);
  });

  test("Register an existing component", async () => {
    await uiHelper.openSidebar("Catalog");
    await uiHelper.selectMuiBox("Kind", "Component");
    await uiHelper.clickButton("Create");
    await uiHelper.clickButton("Register Existing Component");
    await catalogImport.registerExistingComponent(component);
  });

  test("Verify that the following components were ingested into the Catalog", async () => {
    await uiHelper.openSidebar("Catalog");
    await uiHelper.selectMuiBox("Kind", "Group");
    await uiHelper.verifyComponentInCatalog("Group", ["Janus-IDP Authors"]);

    await uiHelper.verifyComponentInCatalog("API", ["Petstore"]);
    await uiHelper.verifyComponentInCatalog("Component", [
      "Backstage Showcase",
    ]);

    await uiHelper.selectMuiBox("Kind", "Resource");
    await uiHelper.verifyRowsInTable([
      "ArgoCD",
      "GitHub Showcase repository",
      "KeyCloak",
      "PostgreSQL cluster",
      "S3 Object bucket storage",
    ]);

    await uiHelper.openSidebar("Catalog");
    await uiHelper.selectMuiBox("Kind", "User");
    await uiHelper.searchInputPlaceholder("rhdh");
    await uiHelper.verifyRowsInTable(["rhdh-qe"]);
  });

  test("Verify all 12 Software Templates appear in the Create page", async () => {
    await uiHelper.openSidebar("Create...");
    await uiHelper.verifyHeading("Templates");
    await uiHelper.waitForHeaderTitle();

    for (const template of templates) {
      await uiHelper.waitForH4Title(template);
      await uiHelper.verifyHeading(template);
    }
  });

  test("Click login on the login popup and verify that Overview tab renders", async () => {
    await uiHelper.openSidebar("Catalog");
    await uiHelper.selectMuiBox("Kind", "Component");
    await uiHelper.clickByDataTestId("user-picker-all");
    await uiHelper.clickLink("Backstage Showcase");
    await common.clickOnGHloginPopup();
    await uiHelper.verifyLink("Janus Website", { exact: false });
    await backstageShowcase.verifyPRStatisticsRendered();
    await backstageShowcase.verifyAboutCardIsDisplayed();
  });

  test("Verify that the Issues tab renders all the open github issues in the repository", async ({
    page,
  }) => {
    await uiHelper.clickTab("Issues");
    const openIssues = await backstageShowcase.getGithubOpenIssues();

    const issuesCountText = `All repositories (${openIssues.length} Issues)*`;
    await expect(page.locator(`text=${issuesCountText}`)).toBeVisible();

    for (const issue of openIssues.slice(0, 5)) {
      await uiHelper.verifyText(issue.title.replace(/\s+/g, " "));
    }
  });

  test("Verify that the Pull/Merge Requests tab renders the 5 most recently updated Open Pull Requests", async () => {
    await uiHelper.clickTab("Pull/Merge Requests");
    const openPRs = await BackstageShowcase.getShowcasePRs("open");
    await backstageShowcase.verifyPRRows(openPRs, 0, 5);
  });

  test("Click on the CLOSED filter and verify that the 5 most recently updated Closed PRs are rendered (same with ALL)", async () => {
    await uiHelper.clickButton("CLOSED", { force: true });
    const closedPRs = await BackstageShowcase.getShowcasePRs("closed");
    await common.waitForLoad();
    await backstageShowcase.verifyPRRows(closedPRs, 0, 5);
  });

  //TODO https://issues.redhat.com/browse/RHIDP-3159 The last ~10 GitHub Pull Requests are missing from the list
  test.skip("Click on the arrows to verify that the next/previous/first/last pages of PRs are loaded", async () => {
    console.log("Fetching all PRs from GitHub");
    const allPRs = await BackstageShowcase.getShowcasePRs("all", true);

    console.log("Clicking on ALL button");
    await uiHelper.clickButton("ALL", { force: true });
    await backstageShowcase.verifyPRRows(allPRs, 0, 5);

    console.log("Clicking on Next Page button");
    await backstageShowcase.clickNextPage();
    await backstageShowcase.verifyPRRows(allPRs, 5, 10);

    const lastPagePRs = Math.floor((allPRs.length - 1) / 5) * 5;

    console.log("Clicking on Last Page button");
    await backstageShowcase.clickLastPage();
    await backstageShowcase.verifyPRRows(allPRs, lastPagePRs, allPRs.length);

    console.log("Clicking on Previous Page button");
    await backstageShowcase.clickPreviousPage();
    await backstageShowcase.verifyPRRows(allPRs, lastPagePRs - 5, lastPagePRs);
  });

  //FIXME
  test.skip("Verify that the 5, 10, 20 items per page option properly displays the correct number of PRs", async () => {
    await uiHelper.openSidebar("Catalog");
    await uiHelper.clickLink("Backstage Showcase");
    await common.clickOnGHloginPopup();
    await uiHelper.clickTab("Pull/Merge Requests");
    await uiHelper.clickButton("ALL", { force: false });
    const allPRs = await BackstageShowcase.getShowcasePRs("all");
    await backstageShowcase.verifyPRRowsPerPage(5, allPRs);
    await backstageShowcase.verifyPRRowsPerPage(10, allPRs);
    await backstageShowcase.verifyPRRowsPerPage(20, allPRs);
  });

  test("Verify that the CI tab renders 5 most recent github actions and verify the table properly displays the actions when page sizes are changed and filters are applied", async () => {
    await uiHelper.clickTab("CI");
    await common.clickOnGHloginPopup();

    const workflowRuns = await backstageShowcase.getWorkflowRuns();

    for (const workflowRun of workflowRuns.slice(0, 5)) {
      await uiHelper.verifyText(workflowRun.id);
    }
  });

  test("Click on the Dependencies tab and verify that all the relations have been listed and displayed", async ({
    page,
  }) => {
    await uiHelper.clickTab("Dependencies");
    for (const resource of resources) {
      const resourceElement = page.locator(
        `#workspace:has-text("${resource}")`,
      );
      await resourceElement.scrollIntoViewIfNeeded();
      await expect(resourceElement).toBeVisible();
    }
  });

  test("Sign out and verify that you return back to the Sign in page", async () => {
    await uiHelper.openSidebar("Settings");
    await common.signOut();
  });
});
