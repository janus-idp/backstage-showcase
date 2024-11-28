// https://github.com/gashcrumb/dynamic-plugins-root-http-middleware/tree/main/plugins/middleware-header-example

import test, { expect, request } from "@playwright/test";

test.only("Check the middleware is working", async () => {
  const endpoint = "api/simple-chat";
  const context = await request.newContext({ baseURL: endpoint });
  const r = await context.get("");
  expect(r.headers["X-PROXY-TEST-HEADER"]);
});
