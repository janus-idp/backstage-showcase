import { expect, Page, test } from "@playwright/test";
import { UIhelper } from "../utils/ui-helper";
import { Common, setupBrowser } from "../utils/common";
import { CatalogImport } from "../support/pages/catalog-import";
import { APIHelper } from "../utils/api-helper";
import { GITHUB_API_ENDPOINTS } from "../utils/api-endpoints";

let page: Page;

test.describe.serial("Link Scaffolded Templates to Catalog Items", () => {
  let uiHelper: UIhelper;
  let common: Common;
  let catalogImport: CatalogImport;

  const template =
    "https://github.com/janus-qe/01-scaffolder-template/blob/main/01-scaffolder-template.yaml";

  const reactAppDetails = {
    owner: "janus-qe/maintainers",
    componentName: `test-scaffoldedfromlink-${Date.now()}`,
    componentPartialName: `test-scaffoldedfromlink-`,
    description: "react app using template",
    repo: `test-scaffolded-${Date.now()}`,
    repoOwner: Buffer.from(
      process.env.GITHUB_ORG || "amFudXMtcWU=",
      "base64",
    ).toString("utf8"), // Default repoOwner janus-qe
  };

  test.beforeAll(async ({ browser }, testInfo) => {
    page = (await setupBrowser(browser, testInfo)).page;

    common = new Common(page);
    uiHelper = new UIhelper(page);
    catalogImport = new CatalogImport(page);

    await common.loginAsGuest();
  });

  test("Register an Template", async () => {
    await uiHelper.openSidebar("Catalog");
    await uiHelper.clickButton("Create");
    await uiHelper.clickButton("Register Existing Component");
    await catalogImport.registerExistingComponent(template, false);
  });

  test("Create a React App using the newly registered Template", async () => {
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
    await uiHelper.verifyRowInTableByUniqueText("Name", [
      reactAppDetails.componentName,
    ]);
    await uiHelper.verifyRowInTableByUniqueText("Description", [
      reactAppDetails.description,
    ]);
    await uiHelper.verifyRowInTableByUniqueText("Repository Location", [
      `github.com?owner=${reactAppDetails.repoOwner}&repo=${reactAppDetails.repo}`,
    ]);

    await uiHelper.clickButton("Create");
    await uiHelper.clickLink("Open in catalog");
  });

  test("Verify Scaffolded link in components Dependencies and scaffoldedFrom relation in entity Raw Yaml ", async () => {
    await uiHelper.openSidebar("Catalog");
    await uiHelper.clickByDataTestId("user-picker-all");
    await uiHelper.searchInputPlaceholder("scaffoldedfromlink-\n");
    await clickOnScaffoldedFromLink();

    await uiHelper.clickTab("Dependencies");

    // Define selectors for labels and nodes
    const labelSelector = 'g[data-testid="label"]'; // Selector for labels
    const nodeSelector = 'g[data-testid="node"]'; // Selector for nodes

    // Verify text inside the 'label' selector
    await uiHelper.verifyTextInSelector(labelSelector, "ownerOf");
    await uiHelper.verifyTextInSelector(labelSelector, "/ ownedBy");
    await uiHelper.verifyTextInSelector(labelSelector, "scaffoldedFrom");

    // Verify text inside the 'node' selector
    await uiHelper.verifyPartialTextInSelector(
      nodeSelector,
      reactAppDetails.componentPartialName,
    );

    await uiHelper.verifyTextInSelector(
      nodeSelector,
      "Create React App Template",
    );

    // Verify the scaffoldedFrom relation in the YAML view of the entity
    await catalogImport.inspectEntityAndVerifyYaml(
      `relations:
      - type: ownedBy
        targetRef: group:janus-qe/maintainers
      - type: scaffoldedFrom
        targetRef: template:default/create-react-app-template-with-timestamp-entityref
    spec:
      type: website
      lifecycle: experimental
      owner: group:janus-qe/maintainers
      scaffoldedFrom: template:default/create-react-app-template-with-timestamp-entityref`,
    );
  });

  test("Verify Registered Template and scaffolderOf relation in entity Raw Yaml", async () => {
    await uiHelper.openSidebar("Catalog");
    await uiHelper.selectMuiBox("Kind", "Template");

    await uiHelper.searchInputPlaceholder("Create React App Template\n");
    await uiHelper.verifyRowInTableByUniqueText("Create React App Template", [
      "website",
    ]);
    await uiHelper.clickLink("Create React App Template");

    await catalogImport.inspectEntityAndVerifyYaml(
      `- type: scaffolderOf\n    targetRef: component:default/${reactAppDetails.componentName}\n`,
    );

    await uiHelper.clickLink("Launch Template");
    await uiHelper.verifyText("Provide some simple information");
  });

  test.afterAll(async () => {
    await APIHelper.githubRequest(
      "DELETE",
      GITHUB_API_ENDPOINTS.deleteRepo(
        reactAppDetails.repoOwner,
        reactAppDetails.repo,
      ),
    );
    await page.close();
  });

  async function clickOnScaffoldedFromLink() {
    const selector =
      'a[href*="/catalog/default/component/test-scaffoldedfromlink-"]';
    await page.locator(selector).first().waitFor({ state: "visible" });
    const link = await page.locator(selector).first();
    await expect(link).toBeVisible();
    await link.click();
  }
});
