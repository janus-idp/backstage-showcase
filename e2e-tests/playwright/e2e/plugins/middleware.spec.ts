// https://github.com/gashcrumb/dynamic-plugins-root-http-middleware/tree/main/plugins/middleware-header-example

import test, { expect, request } from "@playwright/test";
import playwrightConfig from "../../../playwright.config";

test.only("Check the middleware is working", async () => {
  const endpoint = playwrightConfig.use.baseURL + "/api/simple-chat";
  console.log(`middleware endpoint full url: ${endpoint}`);
  const context = await request.newContext({
    baseURL: endpoint,
  });
  const r = await context.get("");
  expect(r.headers["X-PROXY-TEST-HEADER"]);
});
