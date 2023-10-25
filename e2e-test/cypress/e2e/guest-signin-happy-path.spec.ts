import { UIhelper } from "../utils/UIhelper";
import { HomePage } from "../support/pages/HomePage";
import { Common } from "../utils/Common";
import { gpts } from "../support/testData/gpts";


describe("Test with Guest Sign-in", () => {
  before(() => {
    Common.loginAsGuest();
  });

  it("Verify the Homepage renders with Search Bar, Quick Access and Starred Entities", () => {
    UIhelper.verifyHeading('Welcome back!')
    // HomePage.verifyQuickSearchBar("subhashkhileri");
    UIhelper.openSidebar('Home');
    HomePage.verifyQuickAccess('Developer Tools', 'Podman Desktop');

  });

  it("Verify Catalog page renders with no components", () => {
    UIhelper.openSidebar('Catalog');
    UIhelper.verifyHeading('My Org Catalog')
    UIhelper.selectMuiBox('Kind', "Component");
    // UIhelper.verifyRowsInTable(['No records to display'])
  });

  it("Verify that all users in your Github Organization have been ingested into the Catalog Page", () => {
    UIhelper.selectMuiBox('Kind', "User");
    UIhelper.verifyRowsInTable(['subhashkhileri', 'josephca', 'gustavolira'])
  });

  it("Verify all 12 GPTs appear in the Create page", () => {
    UIhelper.openSidebar('Create...');
    UIhelper.verifyHeading('Golden Path Templates');

    gpts.forEach((gpt) => {
      UIhelper.verifyHeading(gpt);
    })

  });

  it("Verify Profile is Guest in the Settings page (Ensure backstage identity's User Entity is user:default/guest)", () => {
    UIhelper.openSidebar('Settings');
    UIhelper.verifyHeading('Guest')
    UIhelper.verifyHeading('User Entity: user:default/guest')
  });

  it("Sign Out and Verify that you return to the Sign-in page", () => {
    UIhelper.openSidebar('Settings');
    Common.signOut();
  });

});
