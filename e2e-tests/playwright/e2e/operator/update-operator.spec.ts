import { test as base, expect } from "@playwright/test";
import { KubeClient } from "../../utils/kube-client";
import { OperatorScript } from "../../support/api/operator-script";
import { LOGGER } from "../../utils/logger";

type OcFixture = {
  namespace: string;
  kube: KubeClient;
};

const kubeTest = base.extend<OcFixture>({
  // eslint-disable-next-line no-empty-pattern
  namespace: async ({}, use) => {
    LOGGER.info("starting fixture: namespace");
    const namespace = "deleteme" + Date.now().toString();
    use(namespace);
  },

  kube: async ({ namespace }, use) => {
    LOGGER.info("starting fixture: kube");
    const api = new KubeClient();
    await api.createNamespaceIfNotExists(namespace);
    await use(api);
    await api.deleteNamespaceAndWait(namespace);
  },
});

kubeTest.describe.serial("OpenShift Operator Tests", () => {
  kubeTest.slow();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  kubeTest("Build OperatorScript", async ({ namespace, kube, page }) => {
    const operator = await OperatorScript.build(namespace);

    await operator.run(
      ["-v 1.4", "--install-operator rhdh", "--install-plan-approval Manual"],
      namespace,
    );

    await page.goto(operator.rhdhUrl);
    const title = await page.title();
    expect(title).toContain("Red Hat Developer Hub");

    await operator.run(
      ["--latest", "--install-operator rhdh", "--install-plan-approval Manual"],
      namespace,
    );

    await page.goto(operator.rhdhUrl);
    expect(title).toContain("Red Hat Developer Hub");
  });
});
