import { OcApi } from "../support/api/oc-api";
import { test as base, expect } from "@playwright/test";

type OcFixture = {
  ocApi: OcApi;
};
const ocpTest = base.extend<OcFixture>({
  // eslint-disable-next-line no-empty-pattern
  ocApi: async ({}, use) => {
    const namespace = Date.now().toString();
    const api = new OcApi(namespace);
    await api.createNamespace();
    use(api);
    api.deleteNamespace();
  },
});

ocpTest.describe("OpenShift Operator Tests", () => {
  ocpTest("Check if OpenShift API is alive", async ({ ocApi }) => {
    const isAlive = await ocApi.isAlive();
    expect(isAlive).toBeTruthy();
    console.log("OpenShift API is alive.");
  });

  ocpTest.skip("List available operators", async ({ ocApi }) => {
    const operators = await ocApi.listAvailableOperators();
    expect(operators.length).toBeGreaterThan(0);
    console.log("Available Operators:", operators);
  });

  ocpTest("Install the Developer Hub Operator", async ({ ocApi }) => {
    await ocApi.installDeveloperHubOperator();
    console.log("Developer Hub Operator installation initiated.");
  });

  ocpTest("Upgrade the Developer Hub Operator", async ({ ocApi }) => {
    const operatorName = "rhdh";
    const newChannel = "stable";
    const newStartingCSV = "rhdh.v2.0.0";

    await ocApi.upgradeOperator(operatorName, newChannel, newStartingCSV);
    console.log(`Operator ${operatorName} upgrade initiated.`);

    const subscription = await ocApi.getSubscription(operatorName);

    expect(subscription.spec.channel).toEqual(newChannel);

    if (newStartingCSV) {
      expect(subscription.spec.startingCSV).toEqual(newStartingCSV);
    }

    console.log(`Operator ${operatorName} has been upgraded successfully.`);
  });

  ocpTest.skip("List installed operators", async ({ ocApi }) => {
    const installedOperators = await ocApi.listInstalledOperators();
    expect(installedOperators.length).toBeGreaterThan(0);
    console.log("Installed Operators in namespace", ":", installedOperators);
  });

  ocpTest("Delete the Developer Hub Operator", async ({ ocApi }) => {
    const operatorName = "rhdh";

    await ocApi.deleteOperator(operatorName);
    console.log(`Operator ${operatorName} deletion initiated.`);

    try {
      await ocApi.getSubscription(operatorName);

      throw new Error(
        `Subscription for operator ${operatorName} still exists after deletion.`,
      );
    } catch (error) {
      expect(error.message).toContain("Failed to fetch subscription");
      console.log(`Operator ${operatorName} has been deleted successfully.`);
    }
  });
});
