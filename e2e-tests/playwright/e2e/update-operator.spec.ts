import { test as base, expect } from "@playwright/test";
import { KubeClient } from "../utils/kube-client";
import { OperatorScript } from "../support/api/operator-script";
import { LOGGER } from "../utils/logger";

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

kubeTest.describe.only("OpenShift Operator Tests", () => {
  LOGGER.info("starting OpenShift Operator Tests");
  kubeTest.slow();
  kubeTest("Create namespace", async ({ namespace, kube }) => {
    expect(kube.checkNamespaceExists(namespace));
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  kubeTest("Build OperatorScript", async ({ namespace, kube }) => {
    LOGGER.info(`const operator = await OperatorScript.build(namespace);`);
    console.log(`const operator = await OperatorScript.build(namespace);`);
    const operator = await OperatorScript.build(namespace);
    LOGGER.info(`await operator.installBackstageCRD(namespace);`);
    console.log(`await operator.installBackstageCRD(namespace);`);
    await operator.installBackstageCRD(namespace);
    LOGGER.info(
      `await operator.run(["-v 1.3", "--install-operator developer-hub"]);`,
    );
    console.log(
      `await operator.run(["-v 1.3", "--install-operator developer-hub"]);`,
    );
    await operator.run(["-v 1.3", "--install-operator developer-hub"]);

    // await kube.createDeployment(namespace);
  });
});

// https://backstage-developer-hub-rhdh-operator.apps.alxdq5slv4a572c9df.eastus.aroapp.io
