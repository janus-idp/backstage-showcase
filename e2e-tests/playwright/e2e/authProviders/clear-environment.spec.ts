import { test } from "@playwright/test";
import * as constants from "../../utils/authenticationProviders/constants";
import { KubeCLient } from "../../utils/kube-client";

test.describe("Setup namespace and configure environment for RHDH", () => {
  test("Delete namespace", async () => {
    await new KubeCLient().deleteNamespaceAndWait(
      constants.AUTH_PROVIDERS_NAMESPACE,
    );
  });
});
