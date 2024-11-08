import { test as base } from "@playwright/test";
import { UIhelper } from "../../../utils/UIhelper";
import { Common } from "../../../utils/Common";
import { Sidebar, SidebarOptions } from "../../../support/pages/sidebar";

const test = base.extend<{ sidebar: Sidebar }>({
  sidebar: async ({ page }, use) => {
    const sidebar = new Sidebar(page);
    await use(sidebar);
  },
});
// Pre-req: backstage-plugin-catalog-backend-module-gitlab-dynamic
// Pre-req: immobiliarelabs-backstage-plugin-gitlab-backend-dynamic
test.describe("gitlab discovery UI tests", () => {
  let uiHelper: UIhelper;
  let common: Common;

  test.beforeEach(async ({ page, sidebar }) => {
    uiHelper = new UIhelper(page);
    common = new Common(page);
    await common.loginAsGuest();
    await sidebar.open(SidebarOptions.Catalog);
  });

  test("GitLab integration for discovering catalog entities from GitLab", async () => {
    await uiHelper.verifyText("rhdh-my-new-service");
    await uiHelper.clickLink("rhdh-my-new-service");
    await uiHelper.verifyHeading("rhdh-my-new-service");
    await uiHelper.verifyText("Description of my new service");
    await uiHelper.verifyText("java");
    await uiHelper.verifyText("production");
    await uiHelper.verifyLink("team-a");
    await uiHelper.verifyLink("project-x");
    await uiHelper.verifyLink("View Source");
  });
});
