import { Common } from '../../../utils/Common';
import { UIhelper } from '../../../utils/UIhelper';
import { ImageRegistry } from '../../../utils/quay/quay';

describe('Test Quay.io plugin', () => {
  const QUAY_REPOSITORY = 'janus-idp/backstage-showcase';

  before(() => {
    Common.loginAsGithubUser();
  });

  it('Check if Image Registry is present', () => {
    UIhelper.openSidebar('Catalog');
    UIhelper.selectMuiBox('Kind', 'Component');
    UIhelper.clickLink('Backstage Showcase');
    UIhelper.clickButton('Log in');
    UIhelper.clickTab('Image Registry');
    UIhelper.verifyRowsInTable(ImageRegistry.getAllGridColumnsText());
    UIhelper.verifyHeading(`Quay repository: ${QUAY_REPOSITORY}`);
    UIhelper.verifyCellsInTable(ImageRegistry.getAllCellsIdentifier());
  });
});
