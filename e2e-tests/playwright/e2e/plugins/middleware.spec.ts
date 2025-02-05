// https://github.com/gashcrumb/dynamic-plugins-root-http-middleware/tree/main/plugins/middleware-header-example

import test from "@playwright/test";
import { Common } from "../../utils/common";

test.only("Check the middleware is working", async ({ page }) => {
  const common = new Common(page);
  await common.loginAsGuest();
});
