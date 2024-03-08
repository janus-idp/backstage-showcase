import { test, Page } from '@playwright/test';
import { Common } from '../utils/Common';
import { UIhelper } from '../utils/UIhelper';

let page: Page;
test.describe.skip('Google signin happy path', () => {
  let uiHelper: UIhelper;
  let common: Common;
  const google_user_id = 'rhdhtest@gmail.com';

  test.beforeAll(async ({ browser }) => {
    const cookiesBase64 = process.env.GOOGLE_ACC_COOKIE;
    const cookiesString = Buffer.from(cookiesBase64, 'base64').toString('utf8');
    const cookies = JSON.parse(cookiesString);

    const context = await browser.newContext({
      storageState: cookies,
      locale: 'en-US',
    });
    page = await context.newPage();

    uiHelper = new UIhelper(page);
    common = new Common(page);

    await common.loginAsGuest();
  });

  test('Verify Google Sign in', async () => {
    await uiHelper.openSidebar('Settings');
    await uiHelper.clickTab('Authentication Providers');
    await page.getByTitle('Sign in to Google').click();
    await uiHelper.clickButton('Log in');
    await common.googleSignIn(google_user_id);
    await uiHelper.verifyText(google_user_id, false);
  });

  test.afterAll(async () => {
    await page.close();
  });
});
