import { test } from '@playwright/test';
import { Common, setupBrowser } from '../../../../playwright/utils/Common';
import { UIhelper } from '../../../../playwright/utils/UIhelper';
import { Tekton } from '../../../utils/tekton/tekton';

// Pre-req: Enable tekton, kubernetes, kubernetes-backend plugins
// Pre-req: install Red Hat OpenShift Pipelines Operator
// Pre-req: Create a pipeline run
// Pre-req: A kubernetes cluster containing pipeline and pipelinerun resources labeled with backstage.io/kubernetes-id: developer-hub
// Pre-req: A catalog entity with the matching backstage.io/kubernetes-id: developer-hub annotation as well as the janus-idp.io/tekton : <BACKSTAGE_ENTITY_NAME> annotation

test.describe('Test Tekton plugin', () => {
  let common: Common;
  let uiHelper: UIhelper;
  let tekton: Tekton;

  test.beforeAll(async ({ browser }, testInfo) => {
    const page = (await setupBrowser(browser, testInfo)).page;
    common = new Common(page);
    await common.loginAsGuest();
    uiHelper = new UIhelper(page);
    tekton = new Tekton(page);
  });

  test('Check Pipeline Run', async () => {
    await tekton.goToBackstageJanusProject();
    await tekton.ensurePipelineRunsTableIsNotEmpty();
    await uiHelper.verifyHeading('Pipeline Runs');
    await uiHelper.verifyTableHeadingAndRows(
      tekton.getAllGridColumnsTextForPipelineRunsTable(),
    );
  });

  test('Check search functionality', async () => {
    await tekton.goToBackstageJanusProject();
    await tekton.search('hello-world'); //name of the PipelineRun
    await tekton.ensurePipelineRunsTableIsNotEmpty();
  });

  test('Check if modal is opened after click on the pipeline stage', async () => {
    await tekton.goToBackstageJanusProject();
    await tekton.clickOnExpandRowFromPipelineRunsTable();
    await tekton.openModalEchoHelloWorld();
    await tekton.isModalOpened();
    await tekton.checkPipelineStages(['echo-hello-world', 'echo-bye']);
    await tekton.checkPipelineOutput([
      'STEP-ECHO-HELLO-WORLD',
      'Hello, World!',
    ]);
  });
});
