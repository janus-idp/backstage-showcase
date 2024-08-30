import { test, Page, TestInfo, expect } from '@playwright/test';
import { Common, setupBrowser } from '../utils/Common';
import { ThemeVerifier } from '../utils/custom-theme/theme-verifier';

let page: Page;

test.describe('CustomTheme should be applied', () => {
  let common: Common;
  let themeVerifier: ThemeVerifier;

  test.beforeAll(async ({ browser }, testInfo) => {
    page = (await setupBrowser(browser, testInfo)).page;
    common = new Common(page);
    themeVerifier = new ThemeVerifier(page);

    await common.loginAsGuest();
  });

  // eslint-disable-next-line no-empty-pattern
  test('Verify that theme light colors are applied and make screenshots', async ({}, testInfo: TestInfo) => {
    await themeVerifier.setTheme('Light');
    await themeVerifier.verifyHeaderGradient(
      'none, linear-gradient(90deg, rgb(248, 248, 248), rgb(248, 248, 248))',
    );
    await themeVerifier.verifyBorderLeftColor('rgb(255, 95, 21)');
    await themeVerifier.takeScreenshotAndAttach(
      'screenshots/custom-theme-light-inspection.png',
      testInfo,
      'custom-theme-light-inspection',
    );
    //await themeVerifier.verifyPrimaryColors('rgb(255, 95, 21)') //TODO: comment out when the primary color issue is fixed (RHIDP-3107)
  });

  // eslint-disable-next-line no-empty-pattern
  test('Verify that theme dark colors are applied and make screenshots', async ({}, testInfo: TestInfo) => {
    await themeVerifier.setTheme('Dark');
    await themeVerifier.verifyHeaderGradient(
      'none, linear-gradient(90deg, rgb(0, 0, 208), rgb(255, 246, 140))',
    );
    await themeVerifier.verifyBorderLeftColor('rgb(244, 238, 169)');
    await themeVerifier.takeScreenshotAndAttach(
      'screenshots/custom-theme-dark-inspection.png',
      testInfo,
      'custom-theme-dark-inspection',
    );
    // await themeVerifier.verifyPrimaryColors('#ab75cf') //TODO: comment out when the primary color issue is fixed (RHIDP-3107)
  });

  test('Verify that tab icon for Backstage can be customized', async () => {
    const customIcon =
      'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDIwMDEwOTA0Ly9FTiIgImh0dHA6Ly93d3cudzMub3JnL1RSLzIwMDEvUkVDLVNWRy0yMDAxMDkwNC9EVEQvc3ZnMTAuZHRkIj4KPCEtLSBDcmVhdGVkIHVzaW5nIEtyaXRhOiBodHRwczovL2tyaXRhLm9yZyAtLT4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIAogICAgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiCiAgICB4bWxuczprcml0YT0iaHR0cDovL2tyaXRhLm9yZy9uYW1lc3BhY2VzL3N2Zy9rcml0YSIKICAgIHhtbG5zOnNvZGlwb2RpPSJodHRwOi8vc29kaXBvZGkuc291cmNlZm9yZ2UubmV0L0RURC9zb2RpcG9kaS0wLmR0ZCIKICAgIHdpZHRoPSI4MHB0IgogICAgaGVpZ2h0PSI4MHB0IgogICAgdmlld0JveD0iMCAwIDgwIDgwIj4KPGRlZnMvPgo8dGV4dCBpZD0ic2hhcGUwIiBrcml0YTp1c2VSaWNoVGV4dD0idHJ1ZSIgdGV4dC1yZW5kZXJpbmc9ImF1dG8iIGtyaXRhOnRleHRWZXJzaW9uPSIzIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxLjU5OTk5OTk5OTk5OTk5LCA2Mi44MTI1KSIgZmlsbD0iI2ZmZmZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIwIiBzdHJva2UtbGluZWNhcD0ic3F1YXJlIiBzdHJva2UtbGluZWpvaW49ImJldmVsIiBsZXR0ZXItc3BhY2luZz0iMCIgd29yZC1zcGFjaW5nPSIwIiBzdHlsZT0idGV4dC1hbGlnbjogc3RhcnQ7dGV4dC1hbGlnbi1sYXN0OiBhdXRvO2ZvbnQtZmFtaWx5OiBSZWQgSGF0IE1vbm87Zm9udC1zaXplOiA2NDtmb250LXdlaWdodDogNzAwOyI+PHRzcGFuIHg9IjAiPlFFPC90c3Bhbj48L3RleHQ+Cjwvc3ZnPgo=';
    const tabIcon = await page.locator('#dynamic-favicon').getAttribute('href');
    expect(tabIcon).toEqual(customIcon);
  });
});
