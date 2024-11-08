import { Sidebar } from "../pages/sidebar";
import { test as base } from "@playwright/test";

export const sidebarExtendedTest = base.extend<{ sidebar: Sidebar }>({
  sidebar: async ({ page }, use) => {
    const sidebar = new Sidebar(page);
    await use(sidebar);
  },
});
