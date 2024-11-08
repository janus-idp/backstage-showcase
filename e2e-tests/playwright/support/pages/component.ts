import { Page } from "@playwright/test";

export abstract class PageComponent {
  readonly page: Page;
  constructor(page: Page) {
    this.page = page;
  }

  goto() {
    throw "PageComponent should't have a goto implementation";
  }
}
