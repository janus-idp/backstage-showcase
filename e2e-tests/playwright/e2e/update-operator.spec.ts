import { test as base, expect } from "@playwright/test";
import { KubeClient } from "../utils/kube-client";

type OcFixture = {
  namespace: string;
  kube: KubeClient;
};
const kubeTest = base.extend<OcFixture>({
  // eslint-disable-next-line no-empty-pattern
  namespace: async ({}, use) => {
    const namespace = Date.now().toString();
    use(namespace);
  },

  kube: async ({ namespace }, use) => {
    const api = new KubeClient();
    await api.createNamespaceIfNotExists(namespace);
    use(api);
    api.deleteNamespaceAndWait(namespace);
  },
});

kubeTest.describe.only("OpenShift Operator Tests", () => {
  kubeTest("Create namespace", async ({ namespace, kube }) => {
    expect(kube.checkNamespaceExists(namespace));
  });
});
