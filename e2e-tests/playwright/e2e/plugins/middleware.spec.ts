// https://github.com/gashcrumb/dynamic-plugins-root-http-middleware/tree/main/plugins/middleware-header-example

import test from "@playwright/test";
import * as constants from "../../utils/authenticationProviders/constants";

import { HelmActions } from "../../utils/helm";
import { Common } from "../../utils/common";
import { runShellCmd } from "../../utils/helper";
import { LOGGER } from "../../utils/logger";

test.only("Check the middleware is working", async ({ page }) => {
  test.slow();
  const common = new Common(page);
  const cwd = process.cwd();
  LOGGER.info(`yarn commands starting...`);
  await runShellCmd(`
    git clone https://github.com/gashcrumb/dynamic-plugins-root-http-middleware.git "${cwd}/middleware"
    cd "${cwd}/middleware"
    echo "Running yarn install..."
    yarn install
    echo "Running yarn tsc..."
    yarn tsc
    echo "Running yarn build..."
    yarn build
    echo "Running yarn export-local..."
    yarn export-local
    `);
  LOGGER.info(`yarn commands ran`);
  const middlewarePlugins = [
    "--set global.dynamic.includes[0]=dynamic-plugins.default.yaml",
    "--set global.dynamic.plugins[0].package=./local-plugins/internal-backstage-plugin-middleware-header-example-dynamic",
    "--set global.dynamic.plugins[0].disabled=false",
    "--set global.dynamic.plugins[1].package=./local-plugins/internal-backstage-plugin-simple-chat",
    "--set global.dynamic.plugins[1].disabled=false",
    "--set global.dynamic.plugins[1].pluginConfig.dynamicPlugins.frontend.internal\\.backstage-plugin-simple-chat.appIcons[0].name=chatIcon",
    "--set global.dynamic.plugins[1].pluginConfig.dynamicPlugins.frontend.internal\\.backstage-plugin-simple-chat.appIcons[0].importName=ChatIcon",
    "--set global.dynamic.plugins[1].pluginConfig.dynamicPlugins.frontend.internal\\.backstage-plugin-simple-chat.dynamicRoutes[0].path=/simple-chat",
    "--set global.dynamic.plugins[1].pluginConfig.dynamicPlugins.frontend.internal\\.backstage-plugin-simple-chat.dynamicRoutes[0].importName=SimpleChatPage",
    "--set global.dynamic.plugins[1].pluginConfig.dynamicPlugins.frontend.internal\\.backstage-plugin-simple-chat.dynamicRoutes[0].menuItem.text=Simple Chat",
  ];

  await HelmActions.upgradeHelmChartWithWait(
    constants.AUTH_PROVIDERS_RELEASE,
    constants.AUTH_PROVIDERS_CHART,
    constants.AUTH_PROVIDERS_NAMESPACE,
    constants.AUTH_PROVIDERS_VALUES_FILE,
    constants.CHART_VERSION,
    constants.QUAY_REPO,
    constants.TAG_NAME,
    middlewarePlugins,
  );

  await common.loginAsGuest();
  await page.goto("/simple-chat", { waitUntil: "networkidle" });
  test.fail();
});
