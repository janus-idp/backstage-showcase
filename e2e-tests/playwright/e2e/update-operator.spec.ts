import { OcApi } from "../support/api/oc-api";
import { test as base, expect } from "@playwright/test";

type OcFixture = {
  ocApi: OcApi;
};

const ocpTest = base.extend<OcFixture>({
  // eslint-disable-next-line no-empty-pattern
  ocApi: async ({}, use) => {
    use(new OcApi());
  },
});

ocpTest.describe("OpenShift Operator Tests", () => {
  ocpTest("Check if OpenShift API is alive", async ({ ocApi }) => {
    const isAlive = await ocApi.isAlive();
    expect(isAlive).toBeTruthy();
    console.log("OpenShift API is alive.");
  });

  ocpTest("List available operators", async ({ ocApi }) => {
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
    const namespace = "rhdh-nil";
    const newChannel = "stable";
    const newStartingCSV = "rhdh.v2.0.0";

    await ocApi.upgradeOperator(
      operatorName,
      namespace,
      newChannel,
      newStartingCSV,
    );
    console.log(`Operator ${operatorName} upgrade initiated.`);

    const subscription = await ocApi.getSubscription(operatorName, namespace);

    expect(subscription.spec.channel).toEqual(newChannel);

    if (newStartingCSV) {
      expect(subscription.spec.startingCSV).toEqual(newStartingCSV);
    }

    console.log(`Operator ${operatorName} has been upgraded successfully.`);
  });

  ocpTest("List installed operators", async ({ ocApi }) => {
    const namespace = "rhdh-nil";
    const installedOperators = await ocApi.listInstalledOperators(namespace);
    expect(installedOperators.length).toBeGreaterThan(0);
    console.log(
      "Installed Operators in namespace",
      namespace,
      ":",
      installedOperators,
    );
  });

  ocpTest("Delete the Developer Hub Operator", async ({ ocApi }) => {
    const operatorName = "rhdh";
    const namespace = "rhdh-nil";

    await ocApi.deleteOperator(operatorName, namespace);
    console.log(`Operator ${operatorName} deletion initiated.`);

    try {
      await ocApi.getSubscription(operatorName, namespace);

      throw new Error(
        `Subscription for operator ${operatorName} still exists after deletion.`,
      );
    } catch (error) {
      expect(error.message).toContain("Failed to fetch subscription");
      console.log(`Operator ${operatorName} has been deleted successfully.`);
    }
  });
});
