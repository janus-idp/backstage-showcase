import { test } from "@playwright/test";
import * as constants from "../../utils/authenticationProviders/constants";
import { KUBERNETES_CLIENT } from "../../utils/helper";

test.describe("Setup namespace and configure environment for RHDH", () => {
  test("Delete namespace", async () => {
    await KUBERNETES_CLIENT.deleteNamespaceAndWait(
      constants.AUTH_PROVIDERS_NAMESPACE,
    );
  });
});
