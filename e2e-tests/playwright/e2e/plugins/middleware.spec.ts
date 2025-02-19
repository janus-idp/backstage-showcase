// https://github.com/gashcrumb/dynamic-plugins-root-http-middleware/tree/main/plugins/middleware-header-example

import test from "@playwright/test";

import { Common } from "../../utils/common";
import { LOGGER } from "../../utils/logger";

test.only("Check the middleware is working", async ({ page }) => {
  test.slow();
  const common = new Common(page);
  LOGGER.info(`yarn commands starting...`);

  await common.loginAsGuest();
  await page.goto("/simple-chat", { waitUntil: "networkidle" });
  await page.getByRole("checkbox", { name: "Use Proxy" }).check();
  await page.getByRole("textbox").fill("hi");
  await page.getByRole("textbox").press("Enter");
  test.fail();
});
