import { expect, Page } from '@playwright/test';
import { UIhelper } from '../../utils/UIhelper';
import { GithubApi } from '../api/github';

export class ComponentView {
  private page: Page;
  private uiHelper: UIhelper;
  githubLink = (path: string): string => {
    return `a[href*="${GithubApi.URL}${path}"]`;
  };

  constructor(page: Page) {
    this.page = page;
    this.uiHelper = new UIhelper(page);
  }

  async validateGithubLink(s: string) {
    const url = this.githubLink(s);
    const link = this.page.locator(url).first();
    await expect(link).toBeVisible();
  }
}
