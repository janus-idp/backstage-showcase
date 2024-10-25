import { test } from "@playwright/test";
import { UIhelper } from "../utils/UIhelper";
import { Common } from "../utils/Common";
import { CatalogImport } from "../support/pages/CatalogImport";
import { APIHelper } from "../utils/APIHelper";
import { githubAPIEndpoints } from "../utils/APIEndpoints";
import { GH_USER_IDAuthFile_rhdh } from "../support/auth/auth_constants";

test.use({ storageState: GH_USER_IDAuthFile_rhdh });
test.describe("Link Scaffolded Templates to Catalog Items", () => {
  const template =
    "https://github.com/janus-idp/backstage-plugins/blob/main/plugins/scaffolder-annotator-action/examples/templates/01-scaffolder-template.yaml";

  const reactAppDetails = {
    owner: "janus-qe/maintainers",
    componentName: `test-scaffoldedfromlink-${Date.now()}`,
    description: "react app using template",
    repo: `test-scaffolded-${Date.now()}`,
    repoOwner: Buffer.from(
      process.env.GITHUB_ORG || "amFudXMtcWU=",
      "base64",
    ).toString("utf8"), // Default repoOwner janus-qe
  };

  test.beforeEach(async ({ page, context }) => {
    const uiHelper = new UIhelper(page);
    await Common.logintoGithub(context);
    await uiHelper.openSidebar("Catalog");
  });

  test("Register an Template", async ({ page }) => {
    const uiHelper = new UIhelper(page);
    const catalogImport = new CatalogImport(page);
    await uiHelper.openSidebar("Catalog");
    await uiHelper.clickButton("Create");
    await uiHelper.clickButton("Register Existing Component");
    await catalogImport.registerExistingComponent(template, false);
  });

  test("Create a React App using the newly registered Template", async ({
    page,
  }) => {
    const uiHelper = new UIhelper(page);

    await uiHelper.openSidebar("Catalog");
    await uiHelper.clickButton("Create");
    await uiHelper.searchInputPlaceholder("Create React App Template");
    await uiHelper.verifyText("Create React App Template");
    await uiHelper.waitForTextDisappear("Add ArgoCD to an existing project");
    await uiHelper.clickButton("Choose");

    await uiHelper.fillTextInputByLabel("Name", reactAppDetails.componentName);
    await uiHelper.fillTextInputByLabel(
      "Description",
      reactAppDetails.description,
    );
    await uiHelper.fillTextInputByLabel("Owner", reactAppDetails.owner);
    await uiHelper.clickButton("Next");

    await uiHelper.fillTextInputByLabel("Owner", reactAppDetails.repoOwner);
    await uiHelper.fillTextInputByLabel("Repository", reactAppDetails.repo);
    await uiHelper.pressTab();
    await uiHelper.clickButton("Review");

    await uiHelper.verifyRowInTableByUniqueText("Owner", [
      `group:${reactAppDetails.owner}`,
    ]);
    await uiHelper.verifyRowInTableByUniqueText("Component Id", [
      reactAppDetails.componentName,
    ]);
    await uiHelper.verifyRowInTableByUniqueText("Description", [
      reactAppDetails.description,
    ]);
    await uiHelper.verifyRowInTableByUniqueText("Repo Url", [
      `github.com?owner=${reactAppDetails.repoOwner}&repo=${reactAppDetails.repo}`,
    ]);
  });

  test("Verify Scaffolded link in components Dependencies and scaffoldedFrom relation in entity Raw Yaml ", async ({
    page,
  }) => {
    const uiHelper = new UIhelper(page);
    const catalogImport = new CatalogImport(page);
    const common = new Common(page);
    await uiHelper.clickButton("Create");
    await uiHelper.clickLink("Open in catalog");
    await common.clickOnGHloginPopup();
    await uiHelper.clickTab("Dependencies");
    await uiHelper.verifyText(
      `ownerOf / ownedByscaffoldedFromcomponent:${reactAppDetails.componentName}group:${reactAppDetails.owner}Create React App Template`,
    );
    await catalogImport.inspectEntityAndVerifyYaml(
      `- type: scaffoldedFrom\n    targetRef: template:default/create-react-app-template-with-timestamp-entityref\n    target:\n      kind: template\n      namespace: default\n      name: create-react-app-template-with-timestamp-entityref`,
    );
  });

  test("Verify Registered Template and scaffolderOf relation in entity Raw Yaml", async ({
    page,
  }) => {
    const uiHelper = new UIhelper(page);
    const catalogImport = new CatalogImport(page);
    await uiHelper.openSidebar("Catalog");
    await uiHelper.selectMuiBox("Kind", "Template");
    await uiHelper.searchInputPlaceholder("Create React App Template");
    await uiHelper.verifyRowInTableByUniqueText("Create React App Template", [
      "website",
    ]);
    await uiHelper.clickLink("Create React App Template");

    await catalogImport.inspectEntityAndVerifyYaml(
      `- type: scaffolderOf\n    targetRef: component:default/${reactAppDetails.componentName}\n    target:\n      kind: component\n      namespace: default\n      name: ${reactAppDetails.componentName}\n`,
    );

    await uiHelper.clickLink("Launch Template");
    await uiHelper.verifyText("Provide some simple information");
  });

  test.afterAll(async () => {
    await APIHelper.githubRequest(
      "DELETE",
      githubAPIEndpoints.deleteRepo(
        reactAppDetails.repoOwner,
        reactAppDetails.repo,
      ),
    );
  });
});
