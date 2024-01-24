import { HomePagePO } from '../pageObjects/page-obj';
import { UIhelper } from '../../utils/UIhelper';
import { Page, expect } from '@playwright/test';

export class HomePage {
  private page: Page;
  private uiHelper: UIhelper;

  constructor(page: Page) {
    this.page = page;
    this.uiHelper = new UIhelper(page);
  }
  async verifyQuickSearchBar(text: string) {
    const searchBar = this.page.locator(HomePagePO.searchBar);
    await searchBar.waitFor();
    await searchBar.fill('');
    await searchBar.type(text + '\n'); // '\n' simulates pressing the Enter key
    await this.uiHelper.verifyLink(text);
  }

  async verifyQuickAccess(
    section: string,
    quickAccessItem: string,
    expand = false,
  ) {
    await this.page.waitForSelector(HomePagePO.MuiAccordion);
    const sectionLocator = this.page
      .locator(HomePagePO.MuiAccordion)
      .filter({ hasText: section });

    if (expand) {
      await sectionLocator.click();
    }

    await sectionLocator.waitFor();
    const itemLocator = sectionLocator
      .locator(`a div[class*="MuiListItemText-root"]`)
      .filter({ hasText: quickAccessItem });
    await itemLocator.waitFor({ state: 'visible' });
    expect(itemLocator.isVisible()).toBeTruthy();
  }
}
