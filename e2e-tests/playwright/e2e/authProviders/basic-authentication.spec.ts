import { test, Page, expect } from '@playwright/test';
import { Common, setupBrowser } from '../../utils/Common';
import { UIhelper } from '../../utils/UIhelper';
import * as constants from '../../utils/authenticationProviders/constants';
import { logger } from '../../utils/authenticationProviders/Logger';
import {
  k8sClient,
  ensureEnvSecretExists,
  ensureNewPolicyConfigMapExists,
  upgradeHelmChartWithWait,
  deleteHelmReleaseWithWait,
} from '../../utils/authenticationProviders/helper';

let page: Page;

test.beforeAll('Prepare environment for Basic Authentication', async () => {
  await k8sClient.createNamespaceIfNotExists(
    constants.AUTH_PROVIDERS_NAMESPACE,
  );
  await ensureNewPolicyConfigMapExists(
    'rbac-policy',
    constants.AUTH_PROVIDERS_NAMESPACE,
  );
  await ensureEnvSecretExists(
    'rhdh-secrets',
    constants.AUTH_PROVIDERS_NAMESPACE,
  );
});

test.describe('Standard authentication providers: Basic authentication', () => {
  let common: Common;
  let uiHelper: UIhelper;

  test.beforeAll(async ({ browser }, testInfo) => {
    if (testInfo.retry > 0) {
      logger.info(`Retry #${testInfo.retry}.`);
    }
    page = (await setupBrowser(browser, testInfo)).page;
    common = new Common(page);
    uiHelper = new UIhelper(page);
    expect(process.env.BASE_URL).not.toBeNull();
    logger.info(`Base Url is ${process.env.BASE_URL}`);
    logger.info(
      'Starting scenario: Standard authentication providers: Basic authentication',
    );
  });

  test.afterAll(async () => {
    // DUMP LOGS TO FILE
    // source .ibm/pipelines/openshift-ci-tests.sh && save_all_pod_logs $namespace
    // or run script
    //#!/bin/bash
    //. ~/lib/testlib.src
    //one
    //two
  });

  test('1. Verify guest login can work when no auth provider is configured (dangerouslyAllowSignInWithoutUserInCatalog is enabled by default but it should not conflict with the guest login).', async () => {
    test.setTimeout(300 * 1000);
    logger.info(
      'Executing testcase: Verify guest login can work when no auth provider is configured (dangerouslyAllowSignInWithoutUserInCatalog is enabled by default but it should not conflict with the guest login).',
    );

    await upgradeHelmChartWithWait(
      constants.AUTH_PROVIDERS_RELEASE,
      constants.AUTH_PROVIDERS_CHART,
      constants.AUTH_PROVIDERS_NAMESPACE,
      constants.AUTH_PROVIDERS_VALUES_FILE,
      [
        '--set upstream.backstage.appConfig.auth.providers=null',
        '--set upstream.backstage.appConfig.auth.environment=development',
        '--set upstream.backstage.appConfig.catalog.providers=null',
      ],
    );

    // Guest login should work
    await common.loginAsGuest();
    await uiHelper.openSidebar('Settings');
    await uiHelper.verifyHeading('Guest');
    await uiHelper.openSidebar('Settings');
    await common.signOut();
  });

  test('2. Login should fail when an authProvider is configured without the ingester.', async () => {
    // Update cofiguration to setup authentication providers, but no ingesters
    // Only providers using the 'signInWithCatalogUserOptionalmethod' to sign in are affected by the 'dangerouslyAllowSignInWoutUserInCatalog' setting
    // At the moment, Microsoft yes, oidc no, github (yes by default, ingestion is not working)
    // Since no ingester is configured for Microsoft Auth Provider, the login should fail with the error:
    // "Login failed; caused by Error: Sign in failed: users/groups have not been ingested into the catalog. Please refer to the authentication provider docs for more information on how to ingest users/groups to the catalog with the appropriate entity provider."

    test.setTimeout(300 * 1000);
    logger.info(
      'Executing testcase: Login should fail when an authProvider is configured without the ingester.',
    );

    await upgradeHelmChartWithWait(
      constants.AUTH_PROVIDERS_RELEASE,
      constants.AUTH_PROVIDERS_CHART,
      constants.AUTH_PROVIDERS_NAMESPACE,
      constants.AUTH_PROVIDERS_VALUES_FILE,
      [
        '--set upstream.backstage.appConfig.auth.environment=development',
        '--set upstream.backstage.appConfig.signInPage=microsoft',
        '--set upstream.backstage.appConfig.catalog.providers=null',
      ],
    );

    await common.MicrosoftAzureLogin(
      constants.AZURE_LOGIN_USERNAME,
      constants.AZURE_LOGIN_PASSWORD,
    );

    await uiHelper.verifyAlertErrorMessage(
      'Login failed; caused by Error: Sign in failed: users/groups have not been ingested into the catalog. Please refer to the authentication provider docs for more information on how to ingest users/groups to the catalog with the appropriate entity provider.',
    );
  });

  test('3. Set dangerouslyAllowSignInWithoutUserInCatalog to false. Login should now work but no User Entities are in the Catalog', async () => {
    // Set upstream.backstage.appConfig.dangerouslyAllowSignInWithoutUserInCatalog = true
    // The Microsoft login should now be successful

    test.setTimeout(300 * 1000);
    logger.info(
      'Execute testcase: Set dangerouslyAllowSignInWithoutUserInCatalog to false. Login should now work but no User Entities are in the Catalog',
    );

    await upgradeHelmChartWithWait(
      constants.AUTH_PROVIDERS_RELEASE,
      constants.AUTH_PROVIDERS_CHART,
      constants.AUTH_PROVIDERS_NAMESPACE,
      constants.AUTH_PROVIDERS_VALUES_FILE,
      [
        '--set upstream.backstage.appConfig.auth.environment=development',
        '--set upstream.backstage.appConfig.signInPage=microsoft',
        '--set upstream.backstage.appConfig.dangerouslyAllowSignInWithoutUserInCatalog=true',
        '--set upstream.backstage.appConfig.catalog.providers=null',
      ],
    );

    await common.MicrosoftAzureLogin(
      constants.AZURE_LOGIN_USERNAME,
      constants.AZURE_LOGIN_PASSWORD,
    );

    await uiHelper.openSidebar('Settings');
    await uiHelper.verifyParagraph(constants.AZURE_LOGIN_USERNAME);

    // check no entities are in the catalog
    await page.goto('/catalog?filters[kind]=user&filters[user]=all');
    await uiHelper.verifyHeading('My Org Catalog');
    await uiHelper.searchInputPlaceholder(constants.AZURE_LOGIN_FIRSTNAME);
    await uiHelper.verifyRowsInTable(['No records to display']);
    await uiHelper.openSidebar('Settings');
    await common.signOut();
  });
});

test.afterAll('After all, delete release (if any)', async () => {
  await deleteHelmReleaseWithWait(
    constants.AUTH_PROVIDERS_RELEASE,
    constants.AUTH_PROVIDERS_NAMESPACE,
  );
});
