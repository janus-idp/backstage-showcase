import { test, expect } from '@playwright/test';
import { UIhelper } from '../utils/UIhelper';

test.describe('Guest User Disabled', () => {
  let uiHelper: UIhelper;

  test.beforeEach(async ({ page }) => {
    uiHelper = new UIhelper(page);
    await page.goto('/');
    await uiHelper.verifyHeading('Select a sign-in method');
  });

  test('Verify that Guest user is disabled', async ({ page }) => {
    await expect(page.getByText('Guest')).not.toBeVisible();
  });
});
