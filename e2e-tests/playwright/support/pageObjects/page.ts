import { Page } from "@playwright/test";

enum pagesUrl {
  rbac = "/rbac",
}

export abstract class PageObject {
  private page: Page;
  private url: pagesUrl;

  constructor(page: Page, url: pagesUrl, go = true) {
    this.page = page;
    this.url = url;
    if (go) this.page.goto(this.url);
  }
}
