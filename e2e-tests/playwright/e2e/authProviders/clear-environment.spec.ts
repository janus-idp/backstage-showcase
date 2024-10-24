import { test } from "@playwright/test";
import * as constants from "../../utils/authenticationProviders/constants";
import { k8sClient } from "../../utils/helper";

test.describe("Setup namespace and configure environment for RHDH", () => {
  test("Delete namespace", async () => {
    await k8sClient.deleteNamespaceAndWait(constants.AUTH_PROVIDERS_NAMESPACE);
  });
});
