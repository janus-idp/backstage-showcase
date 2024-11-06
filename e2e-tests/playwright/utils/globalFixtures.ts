import { test as base } from "@playwright/test";
import { Common } from "./Common";

export const test = base.extend({});

test.beforeEach(async ({ page }) => {
  const frameLocator = page.getByLabel("Login Required");
  if (await frameLocator.isVisible()) {
    await new Common(page).clickOnGHloginPopup();
  }
});

export { expect } from "@playwright/test";
