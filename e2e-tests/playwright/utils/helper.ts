import { LOGGER } from "./logger";
import { spawn } from "child_process";
import * as constants from "./authenticationProviders/constants";
import { expect } from "@playwright/test";
import { KubeClient } from "./kube-client";
import { V1ConfigMap, V1Secret } from "@kubernetes/client-node";

export async function runShellCmd(command: string) {
  return new Promise<string>((resolve) => {
    LOGGER.info(`Executing command ${command}`);
    const process = spawn("/bin/sh", ["-c", command]);
    let result: string;
    process.stdout.on("data", (data) => {
      result = data;
    });
    process.stderr.on("data", (data) => {
      result = data;
    });
    process.on("exit", (code) => {
      LOGGER.info(`Process ended with exit code ${code}: `);
      if (code == 0) {
        resolve(result);
      } else {
        throw Error(`Error executing shell command; exit code ${code}`);
      }
    });
  });
}

export async function upgradeHelmChartWithWait(
  release: string,
  chart: string,
  namespace: string,
  value: string,
  chartVersion: string,
  quayRepo: string,
  tag: string,
  flags: Array<string>,
) {
  LOGGER.info(`Deleting any exisitng helm release ${release}`);
  await deleteHelmReleaseWithWait(release, namespace);

  LOGGER.info(`Upgrading helm release ${release}`);
  const upgradeOutput = await runShellCmd(`helm upgrade \
    -i ${release} ${chart}  \
    --wait --timeout 300s -n ${namespace} \
    --values ${value} \
    --version "${chartVersion}" --set upstream.backstage.image.repository="${quayRepo}" --set upstream.backstage.image.tag="${tag}" \
    --set global.clusterRouterBase=${process.env.K8S_CLUSTER_ROUTER_BASE}  \
    ${flags.join(" ")}`);

  LOGGER.log({
    level: "info",
    message: `Release upgrade returned: `,
    dump: upgradeOutput,
  });

  const configmap = await new KubeClient().getConfigMap(
    `${release}-backstage-app-config`,
    namespace,
  );
  LOGGER.log({
    level: "info",
    message: `Applied confguration for release upgrade: `,
    dump: configmap.body.data,
  });

  //TBD: get dynamic plugins configmap
}

export async function deleteHelmReleaseWithWait(
  release: string,
  namespace: string,
) {
  LOGGER.info(`Deleting release ${release} in namespace ${namespace}`);
  const result = await runShellCmd(
    `helm uninstall ${release} --wait --timeout 300s -n ${namespace} --ignore-not-found`,
  );
  LOGGER.log({
    level: "info",
    message: `Release delete returned: `,
    dump: result,
  });
  return result;
}

export async function getLastSyncTimeFromLogs(
  provider: string,
): Promise<number> {
  let searchString = "Reading msgraph users and groups";
  if (provider == "microsoft") {
    searchString = "Reading msgraph users and groups";
  } else if (provider == "rhsso") {
    searchString = "Reading Keycloak users and groups";
  } else if (provider == "github") {
    searchString = "Reading GitHub users and groups";
  }

  try {
    // TBD: change this to use kube api
    const podName = await runShellCmd(
      `oc get pods -n ${constants.AUTH_PROVIDERS_NAMESPACE} | awk '{print $1}' | grep '^${constants.AUTH_PROVIDERS_POD_STRING}'`,
    );
    const log = await runShellCmd(
      `oc logs ${podName.trim()} -n ${constants.AUTH_PROVIDERS_NAMESPACE} -c backstage-backend | grep "${searchString}" | tail -n1`,
    );
    const syncObj = Date.parse(JSON.parse(log).timestamp);
    return syncObj;
  } catch (e) {
    LOGGER.error(JSON.stringify(e));
    return null;
  }
}

export async function waitForNextSync(provider: string, syncTime?: number) {
  await expect(async () => {
    const lastSyncTimeFromLogs = await getLastSyncTimeFromLogs(provider);
    if (syncTime === undefined) {
      syncTime = lastSyncTimeFromLogs;
    }
    LOGGER.info(
      `Last registered sync time was: ${new Date(syncTime).toUTCString()}; last detected in logs: ${new Date(lastSyncTimeFromLogs).toUTCString()}`,
    );
    expect(lastSyncTimeFromLogs).not.toBeNull();
    expect(lastSyncTimeFromLogs).toBeGreaterThan(syncTime);
  }).toPass({
    intervals: [1_000, 2_000, 10_000],
    timeout: syncTime * 2 * 1000,
  });
}

export async function replaceInRBACPolicyFileConfigMap(
  configMap: string,
  namespace: string,
  match: RegExp | string,
  value: string,
) {
  LOGGER.info(
    `Replacing ${match} with ${value} in existing configmap ${configMap} in namespace ${namespace}`,
  );
  const cm = await ensureNewPolicyConfigMapExists(configMap, namespace);
  const patched = cm.body.data["rbac-policy.csv"].replace(match, value);
  LOGGER.info(`Patch ${patched}`);
  const patch = [
    {
      op: "replace",
      path: "/data",
      value: {
        "rbac-policy.csv": patched,
      },
    },
  ];
  await new KubeClient().updateConfigMap(configMap, namespace, patch);
}

export async function ensureNewPolicyConfigMapExists(
  configMap: string,
  namespace: string,
) {
  const kubeCLient = new KubeClient();
  try {
    LOGGER.info(
      `Ensuring configmap ${configMap} exisists in namespace ${namespace}`,
    );
    await kubeCLient.getConfigMap(configMap, namespace);
    const patch = [
      {
        op: "replace",
        path: "/data",
        value: {
          "rbac-policy.csv": constants.RBAC_POLICY_ROLES,
        },
      },
    ];
    await kubeCLient.updateConfigMap(configMap, namespace, patch);
    return await kubeCLient.getConfigMap(configMap, namespace);
  } catch (e) {
    if (e.response.statusCode == 404) {
      LOGGER.info(
        `Configmap ${configMap} did not exist in namespace ${namespace}. Creating it..`,
      );
      const cmBody: V1ConfigMap = {
        metadata: {
          name: configMap,
          namespace: namespace,
        },
        data: {
          "rbac-policy.csv": constants.RBAC_POLICY_ROLES,
        },
      };
      return await kubeCLient.createCongifmap(namespace, cmBody);
    } else {
      throw e;
    }
  }
}

export async function ensureEnvSecretExists(
  secretName: string,
  namespace: string,
) {
  const kubeCLient = new KubeClient();
  LOGGER.info(`Ensuring secret ${secretName} exists in namespace ${namespace}`);
  const secretData = {
    BASE_URL: Buffer.from(process.env.BASE_URL).toString("base64"),
    AUTH_PROVIDERS_AZURE_CLIENT_SECRET: Buffer.from(
      constants.AUTH_PROVIDERS_AZURE_CLIENT_SECRET,
    ).toString("base64"),
    AUTH_PROVIDERS_AZURE_CLIENT_ID: Buffer.from(
      constants.AUTH_PROVIDERS_AZURE_CLIENT_ID,
    ).toString("base64"),
    AUTH_PROVIDERS_AZURE_TENANT_ID: Buffer.from(
      constants.AUTH_PROVIDERS_AZURE_TENANT_ID,
    ).toString("base64"),
    AUTH_PROVIDERS_REALM_NAME: Buffer.from(
      constants.AUTH_PROVIDERS_REALM_NAME,
    ).toString("base64"),
    AZURE_LOGIN_USERNAME: Buffer.from(constants.AZURE_LOGIN_USERNAME).toString(
      "base64",
    ),
    AZURE_LOGIN_PASSWORD: Buffer.from(constants.AZURE_LOGIN_PASSWORD).toString(
      "base64",
    ),
    RHSSO76_DEFAULT_PASSWORD: Buffer.from(
      constants.RHSSO76_DEFAULT_PASSWORD,
    ).toString("base64"),
    RHSSO76_METADATA_URL: Buffer.from(
      `${constants.RHSSO76_URL}/realms/authProviders`,
    ).toString("base64"),
    RHSSO76_URL: Buffer.from(constants.RHSSO76_URL).toString("base64"),
    RHSSO76_CLIENT_ID: Buffer.from(constants.RHSSO76_CLIENTID).toString(
      "base64",
    ),
    RHSSO76_ADMIN_USERNAME: Buffer.from(
      constants.RHSSO76_ADMIN_USERNAME,
    ).toString("base64"),
    RHSSO76_ADMIN_PASSWORD: Buffer.from(
      constants.RHSSO76_ADMIN_PASSWORD,
    ).toString("base64"),
    RHSSO76_CALLBACK_URL: Buffer.from(
      `${process.env.BASE_URL}/api/auth/oidc/handler/frame`,
    ).toString("base64"),
    RHSSO76_CLIENT_SECRET: Buffer.from(
      constants.RHSSO76_CLIENT_SECRET,
    ).toString("base64"),
    AUTH_ORG_APP_ID: Buffer.from(constants.AUTH_ORG_APP_ID).toString("base64"),
    AUTH_ORG_CLIENT_ID: Buffer.from(constants.AUTH_ORG_CLIENT_ID).toString(
      "base64",
    ),
    AUTH_ORG_CLIENT_SECRET: Buffer.from(
      constants.AUTH_ORG_CLIENT_SECRET,
    ).toString("base64"),
    AUTH_ORG1_PRIVATE_KEY: Buffer.from(
      constants.AUTH_ORG1_PRIVATE_KEY,
    ).toString("base64"),
    AUTH_ORG_WEBHOOK_SECRET: Buffer.from(
      constants.AUTH_ORG_WEBHOOK_SECRET,
    ).toString("base64"),
    AUTH_PROVIDERS_GH_ORG_NAME: Buffer.from(
      constants.AUTH_PROVIDERS_GH_ORG_NAME,
    ).toString("base64"),
  };
  const secret: V1Secret = {
    metadata: {
      name: secretName,
    },
    data: secretData,
  };
  try {
    await kubeCLient.getSecret(secretName, namespace);
    const patch = {
      data: secretData,
    };
    await kubeCLient.updateSecret(secretName, namespace, patch);
    return await kubeCLient.getSecret(secretName, namespace);
  } catch (e) {
    if (e.response.statusCode == 404) {
      LOGGER.info(
        `Secret ${secretName} did not exist yet in namespace ${namespace}. Creating it..`,
      );
      await kubeCLient.createSecret(secret, namespace);
    } else {
      throw e;
    }
  }
}
