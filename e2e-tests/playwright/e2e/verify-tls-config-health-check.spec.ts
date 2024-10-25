import { test } from "@playwright/test";
import { Common } from "../utils/Common";
import { kubeCLient } from "../utils/k8sHelper";

export const k8sClient = new kubeCLient();

test.describe
  .serial("Verify TLS configuration with Postgres DB health check", () => {
  const namespace = process.env.NAME_SPACE_RDS;
  const deploymentName = "rhdh-developer-hub";
  const secretName = "postgres-cred";
  const hostLatest2 = Buffer.from(process.env.RDS_2_HOST).toString("base64");
  const hostLatest3 = Buffer.from(process.env.RDS_3_HOST).toString("base64");

  test("Verify successful DB connection and successful initialization of plugins with latest-1 postgres version", async ({
    page,
  }) => {
    const common = new Common(page);
    await common.loginAsGuest();
  });

  test("Change the config to use the latest-2 postgres version", async () => {
    test.setTimeout(120000);
    const secretData = {
      POSTGRES_HOST: hostLatest2,
    };
    const patch = {
      data: secretData,
    };
    await k8sClient.updateSecret(secretName, namespace, patch);
    await k8sClient.restartDeployment(deploymentName, namespace);
  });

  test("Verify successful DB connection and successful initialization of plugins with latest-2 postgres version", async ({
    page,
  }) => {
    const common = new Common(page);
    await common.loginAsGuest();
  });

  test("Change the config to use the latest-3 postgres version", async () => {
    test.setTimeout(120000);
    const secretData = {
      POSTGRES_HOST: hostLatest3,
    };
    const patch = {
      data: secretData,
    };
    await k8sClient.updateSecret(secretName, namespace, patch);
    await k8sClient.restartDeployment(deploymentName, namespace);
  });

  test("Verify successful DB connection and successful initialization of plugins with latest-3 postgres version", async ({
    page,
  }) => {
    const common = new Common(page);
    await common.loginAsGuest();
  });
});
