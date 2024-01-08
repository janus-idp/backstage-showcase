import { HomePage } from '../../support/pages/HomePage';
import { TechRadar } from '../../support/pages/TechRadar';
import { Common } from '../../utils/Common';
import { UIhelper } from '../../utils/UIhelper';

//Pre-req: Enable backstage-plugin-tech-radar Plugin

describe('Test Customized Quick Access and tech-radar plugin', () => {
  before(() => {
    Common.loginAsGuest();
  });

  it('Verify Customized Quick Access', () => {
    HomePage.verifyQuickAccess('TEST COMMUNITY', 'Website', true);
    HomePage.verifyQuickAccess('MONITORING TOOLS', 'Grafana', true);
    HomePage.verifyQuickAccess('SECURITY TOOLS', 'Vault', true);
  });

  it('Verify tech-radar', () => {
    UIhelper.openSidebar('Tech Radar');
    UIhelper.verifyHeading('Tech Radar');
    UIhelper.verifyHeading('Company Radar');

    TechRadar.verifyRadarDetails('Languages', 'TEST JavaScript');
    TechRadar.verifyRadarDetails('Storage', 'AWS S3');
    TechRadar.verifyRadarDetails('Frameworks', 'React');
    TechRadar.verifyRadarDetails('Infrastructure', 'ArgoCD');
  });
});
