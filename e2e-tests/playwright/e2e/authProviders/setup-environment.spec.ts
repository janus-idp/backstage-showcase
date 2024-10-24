import { test } from "@playwright/test";
import * as constants from "../../utils/authenticationProviders/constants";
import {
  k8sClient,
  ensureEnvSecretExists,
  ensureNewPolicyConfigMapExists,
} from "../../utils/helper";

test.describe("Setup namespace and configure environment for RHDH", () => {
  test("Create namespace", async () => {
    await k8sClient.createNamespaceIfNotExists(
      constants.AUTH_PROVIDERS_NAMESPACE,
    );
  });

  test("Create rbac-policy configMap", async () => {
    await ensureNewPolicyConfigMapExists(
      "rbac-policy",
      constants.AUTH_PROVIDERS_NAMESPACE,
    );
  });

  test("Create rhdh-secrets secret ", async () => {
    await ensureEnvSecretExists(
      "rhdh-secrets",
      constants.AUTH_PROVIDERS_NAMESPACE,
    );
  });
});
