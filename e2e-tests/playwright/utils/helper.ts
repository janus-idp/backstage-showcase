import { logger } from "./Logger";
import { spawn } from "child_process";
import * as constants from "./authenticationProviders/constants";
import { expect } from "@playwright/test";
import { kubeCLient } from "./k8sHelper";
import { V1ConfigMap, V1Secret } from "@kubernetes/client-node";
import { GroupEntity } from "@backstage/catalog-model";
import fs from "fs";
import { APIHelper } from "./APIHelper";

export const k8sClient = new kubeCLient();

export async function runShellCmd(command: string) {
  return new Promise<string>((resolve) => {
    //logger.info(`Executing command ${command}`);
    const process = spawn("/bin/sh", ["-c", command]);
    let result: string;
    process.stdout.on("data", (data) => {
      result = data;
    });
    process.stderr.on("data", (data) => {
      result = data;
    });
    process.on("exit", (code) => {
      if (code == 0) {
        resolve(result);
        return;
      } else {
        logger.info(`Process failed with code ${code}: ${result}`);
        throw Error(`Error executing shell command; exit code ${code}`);
      }
    });
  });
}

export async function upgradeHelmChartWithWait(
  RELEASE: string,
  CHART: string,
  NAMESPACE: string,
  VALUES: string,
  CHART_VERSION: string,
  QUAY_REPO: string,
  TAG_NAME: string,
  FLAGS: Array<string>,
) {
  logger.info(`Deleting any exisitng helm release ${RELEASE}`);
  await deleteHelmReleaseWithWait(RELEASE, NAMESPACE);

  logger.info(`Upgrading helm release ${RELEASE}`);
  const upgradeCMD = `helm upgrade \
    -i ${RELEASE} ${CHART}  \
    --wait --timeout 300s -n ${NAMESPACE} \
    --values ${VALUES} \
    --version "${CHART_VERSION}" --set upstream.backstage.image.repository="${QUAY_REPO}" --set upstream.backstage.image.tag="${TAG_NAME}" \
    --set global.clusterRouterBase=${process.env.K8S_CLUSTER_ROUTER_BASE}  \
    ${FLAGS.join(" ")}`;
  logger.info(`Running upgrade with command ${upgradeCMD}`);

  const upgradeOutput = await runShellCmd(upgradeCMD);

  logger.log({
    level: "info",
    message: `Release upgrade returned: `,
    dump: upgradeOutput.toString(),
  });

  const configmap = await k8sClient.getCongifmap(
    `${RELEASE}-backstage-app-config`,
    NAMESPACE,
  );
  logger.log({
    level: "info",
    message: `Applied confguration for release upgrade: `,
    dump: configmap.body.data,
  });

  //TBD: get dynamic plugins configmap
}

export async function deleteHelmReleaseWithWait(
  RELEASE: string,
  NAMESPACE: string,
) {
  logger.info(`Deleting release ${RELEASE} in namespace ${NAMESPACE}`);
  const result = await runShellCmd(
    `helm uninstall ${RELEASE} --wait --timeout 300s -n ${NAMESPACE} || true`,
  );
  logger.log({
    level: "info",
    message: `Release delete returned: `,
    dump: result.toString(),
  });
  return result.toString();
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
    const p = await k8sClient.coreV1Api.listNamespacedPod(
      constants.AUTH_PROVIDERS_NAMESPACE,
      undefined,
      undefined,
      undefined,
      undefined,
      "app.kubernetes.io/component=backstage",
    );
    const pods = p.body.items.map((pod) => pod.metadata.name);

    const log = await runShellCmd(
      `oc logs ${pods[0].trim()} -n ${constants.AUTH_PROVIDERS_NAMESPACE} -c backstage-backend | grep "${searchString}" | tail -n1`,
    );
    const syncObj = Date.parse(JSON.parse(log).timestamp);
    return syncObj;
  } catch (e) {
    logger.error(JSON.stringify(e));
    return null;
  }
}

export async function WaitForNextSync(SYNC__TIME: number, provider: string) {
  let syncTime: number | null = null;
  await expect(async () => {
    const _syncTime = await getLastSyncTimeFromLogs(provider);
    if (syncTime == null) {
      syncTime = _syncTime;
    }
    logger.info(
      `Last registered sync time was: ${new Date(syncTime).toUTCString()}; last detected in logs:${new Date(_syncTime).toUTCString()}`,
    );
    expect(_syncTime).not.toBeNull();
    expect(_syncTime).toBeGreaterThan(syncTime);
  }).toPass({
    intervals: [1_000, 2_000, 10_000],
    timeout: SYNC__TIME * 2 * 1000,
  });
}

export async function replaceInRBACPolicyFileConfigMap(
  configMap: string,
  namespace: string,
  match: RegExp | string,
  value: string,
) {
  logger.info(
    `Replacing ${match} with ${value} in existing configmap ${configMap} in namespace ${namespace}`,
  );
  const cm = await ensureNewPolicyConfigMapExists(configMap, namespace);
  const patched = cm.body.data["rbac-policy.csv"].replace(match, value);
  logger.info(`Patch ${patched}`);
  const patch = [
    {
      op: "replace",
      path: "/data",
      value: {
        "rbac-policy.csv": patched,
      },
    },
  ];
  await k8sClient.updateCongifmap(configMap, namespace, patch);
}

export async function ensureNewPolicyConfigMapExists(
  configMap: string,
  namespace: string,
) {
  try {
    logger.info(
      `Ensuring configmap ${configMap} exisists in namespace ${namespace}`,
    );
    await k8sClient.getCongifmap(configMap, namespace);
    const patch = [
      {
        op: "replace",
        path: "/data",
        value: {
          "rbac-policy.csv": constants.RBAC_POLICY_ROLES,
        },
      },
    ];
    await k8sClient.updateCongifmap(configMap, namespace, patch);
    return await k8sClient.getCongifmap(configMap, namespace);
  } catch (e) {
    if (e.response.statusCode == 404) {
      logger.info(
        `Configmap ${configMap} did not exsist in namespace ${namespace}. Creating it..`,
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
      return await k8sClient.createCongifmap(namespace, cmBody);
    } else {
      throw e;
    }
  }
}

export async function ensureEnvSecretExists(
  secretName: string,
  namespace: string,
) {
  logger.info(`Ensuring secret ${secretName} exists in namespace ${namespace}`);
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

    RHBK_DEFAULT_PASSWORD: Buffer.from(
      constants.RHSSO76_DEFAULT_PASSWORD,
    ).toString("base64"),
    RHBK_METADATA_URL: Buffer.from(
      `${constants.RHBK_URL}/realms/authProviders`,
    ).toString("base64"),
    RHBK_CLIENT_ID: Buffer.from(constants.RHBK_CLIENTID).toString("base64"),
    RHBK_ADMIN_USERNAME: Buffer.from(constants.RHBK_ADMIN_USERNAME).toString(
      "base64",
    ),
    RHBK_ADMIN_PASSWORD: Buffer.from(constants.RHBK_ADMIN_PASSWORD).toString(
      "base64",
    ),
    RHBK_CALLBACK_URL: Buffer.from(
      `${process.env.BASE_URL}/api/auth/oidc/handler/frame`,
    ).toString("base64"),
    RHBK_CLIENT_SECRET: Buffer.from(constants.RHBK_CLIENT_SECRET).toString(
      "base64",
    ),
    RHBK_URL: Buffer.from(constants.RHBK_URL).toString("base64"),

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
    await k8sClient.getSecret(secretName, namespace);
    const patch = {
      data: secretData,
    };
    await k8sClient.updateSecret(secretName, namespace, patch);
    return await k8sClient.getSecret(secretName, namespace);
  } catch (e) {
    if (e.response.statusCode == 404) {
      logger.info(
        `Secret ${secretName} did not exist yet in namespace ${namespace}. Creating it..`,
      );
      await k8sClient.createSecret(secret, namespace);
    } else {
      throw e;
    }
  }
}

export function parseGroupMemberFromEntity(group: GroupEntity) {
  if (!group.relations) {
    return [];
  }
  return group.relations
    .filter((r) => {
      if (r.type == "hasMember") {
        return true;
      }
    })
    .map((r) => r.targetRef.split("/")[1]);
}

export function parseGroupChildrenFromEntity(group: GroupEntity) {
  if (!group.relations) {
    return [];
  }
  return group.relations
    .filter((r) => {
      if (r.type == "parentOf") {
        return true;
      }
    })
    .map((r) => r.targetRef.split("/")[1]);
}

export function parseGroupParentFromEntity(group: GroupEntity) {
  if (!group.relations) {
    return [];
  }
  return group.relations
    .filter((r) => {
      if (r.type == "childOf") {
        return true;
      }
    })
    .map((r) => r.targetRef.split("/")[1]);
}

export async function dumpAllPodsLogs(filePrefix?: string, folder?: string) {
  const prefix = filePrefix ? filePrefix : "";
  const _folder = folder ? folder : "/tmp";
  const p = await k8sClient.coreV1Api.listNamespacedPod(
    constants.AUTH_PROVIDERS_NAMESPACE,
    undefined,
    undefined,
    undefined,
    undefined,
    "app.kubernetes.io/component=backstage",
  );
  const pods = p.body.items;

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  for (const pod of pods) {
    const backstage_backend_logs =
      await k8sClient.coreV1Api.readNamespacedPodLog(
        pod.metadata.name,
        pod.metadata.namespace,
        "backstage-backend",
      );
    const dynamic_plugins_logs = await k8sClient.coreV1Api.readNamespacedPodLog(
      pod.metadata.name,
      pod.metadata.namespace,
      "install-dynamic-plugins",
    );
    fs.writeFileSync(
      `${_folder}/${prefix}-backend.txt`,
      backstage_backend_logs.body,
      { flag: "w" },
    );
    fs.writeFileSync(
      `${_folder}/${prefix}-init.txt`,
      dynamic_plugins_logs.body,
      { flag: "w" },
    );
  }
}

export async function dumpRHDHUsersAndGroups(
  filePrefix?: string,
  folder?: string,
) {
  const prefix = filePrefix ? filePrefix : "";
  const _folder = folder ? folder : "/tmp";
  const api = new APIHelper();
  api.UseStaticToken(constants.STATIC_API_TOKEN);
  const users = await api.getAllCatalogUsersFromAPI();
  const groups = await api.getAllCatalogGroupsFromAPI();
  const locations = await api.getAllCatalogLocationsFromAPI();

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  fs.writeFileSync(
    `${_folder}/${prefix}-catalog.txt`,
    JSON.stringify({ users, groups, locations }),
    { flag: "w" },
  );
}
