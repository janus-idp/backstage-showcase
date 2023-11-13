import { UIhelper } from '../utils/UIhelper';
import { HomePage } from '../support/pages/HomePage';
import { Common } from '../utils/Common';

describe('Test with Guest Sign-in', () => {
  before(() => {
    Common.loginAsGuest();
  });

  it('Verify the Homepage renders with Search Bar, Quick Access and Starred Entities', () => {
    UIhelper.verifyHeading('Welcome back!');
    UIhelper.openSidebar('Home');
    HomePage.verifyQuickAccess('Developer Tools', 'Podman Desktop');
  });

  it('Verify Catalog page renders with no components', () => {
    UIhelper.openSidebar('Catalog');
    UIhelper.verifyHeading('My Org Catalog');
    UIhelper.selectMuiBox('Kind', 'Component');
  });
});
