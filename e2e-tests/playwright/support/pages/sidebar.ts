import { Locator, Page } from "@playwright/test";
import { PageComponent } from "./component";

export enum SidebarOptions {
  "Home",
  "Create",
  "Plugins",
  "Catalog",
  "Settings",
  "My Group",
  "Create...",
  "References",
  "Bulk import",
  "Learning Paths",
  "Administration",
  "Favorites",
  "Docs",
  "Clusters",
  "Tech Radar",
  "RBAC",
}

export class Sidebar extends PageComponent {
  readonly navBar: Locator;
  elementInSidebar(text: SidebarOptions): Locator {
    return this.page.locator(`nav a:has-text("${text}")`);
  }

  constructor(page: Page) {
    super(page);
    this.navBar = page.locator("nav a");
  }

  async open(navBarText: SidebarOptions) {
    const navLink = this.elementInSidebar(navBarText).first();
    await navLink.waitFor({ state: "visible" });
    await navLink.click();
  }

  async waitUntilVisible() {
    await this.navBar.waitFor({ timeout: 30000 });
  }
}
