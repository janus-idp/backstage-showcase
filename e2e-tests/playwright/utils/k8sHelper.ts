import k8s, { V1ConfigMap } from "@kubernetes/client-node";
import { logger } from "./Logger";
import * as yaml from "js-yaml";

export class kubeCLient {
  coreV1Api: k8s.CoreV1Api;
  appsApi: k8s.AppsV1Api;
  kc: k8s.KubeConfig;

  constructor() {
    logger.info(`Initializing Kubernetes API client`);
    try {
      this.kc = new k8s.KubeConfig();
      this.kc.loadFromOptions({
        clusters: [
          {
            name: "my-openshift-cluster",
            server: process.env.K8S_CLUSTER_URL,
            skipTLSVerify: true,
          },
        ],
        users: [
          {
            name: "ci-user",
            token: process.env.K8S_CLUSTER_TOKEN,
          },
        ],
        contexts: [
          {
            name: "default-context",
            user: "ci-user",
            cluster: "my-openshift-cluster",
          },
        ],
        currentContext: "default-context",
      });

      this.appsApi = this.kc.makeApiClient(k8s.AppsV1Api);
      this.coreV1Api = this.kc.makeApiClient(k8s.CoreV1Api);
    } catch (e) {
      logger.info(e);
      throw e;
    }
  }

  async getConfigMap(configmapName: string, namespace: string) {
    try {
      logger.info(
        `Getting configmap ${configmapName} from namespace ${namespace}`,
      );
      return await this.coreV1Api.readNamespacedConfigMap(
        configmapName,
        namespace,
      );
    } catch (e) {
      logger.error(e.body.message);
      throw e;
    }
  }

  async scaleDeployment(
    deploymentName: string,
    namespace: string,
    replicas: number,
  ) {
    const patch = { spec: { replicas: replicas } };
    try {
      await this.appsApi.patchNamespacedDeploymentScale(
        deploymentName,
        namespace,
        patch,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          headers: { "Content-Type": "application/strategic-merge-patch+json" },
        },
      );
      console.log(`Deployment scaled to ${replicas} replicas.`);
    } catch (error) {
      console.error("Error scaling deployment:", error);
    }
  }

  async getSecret(secretName: string, namespace: string) {
    try {
      logger.info(`Getting secret ${secretName} from namespace ${namespace}`);
      return await this.coreV1Api.readNamespacedSecret(secretName, namespace);
    } catch (e) {
      logger.error(e.body.message);
      throw e;
    }
  }

  async updateConfigMap(
    configmapName: string,
    namespace: string,
    patch: object,
  ) {
    try {
      const options = {
        headers: { "Content-type": k8s.PatchUtils.PATCH_FORMAT_JSON_PATCH },
      };
      logger.info(
        `Updating configmap ${configmapName} in namespace ${namespace}`,
      );
      await this.coreV1Api.patchNamespacedConfigMap(
        configmapName,
        namespace,
        patch,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        options,
      );
    } catch (e) {
      logger.error(e.statusCode, e);
      throw e;
    }
  }

  async updateConfigMapTitle(
    configMapName: string,
    namespace: string,
    newTitle: string,
  ) {
    try {
      const configMapResponse = await this.getConfigMap(
        configMapName,
        namespace,
      );
      const configMap = configMapResponse.body;

      const appConfigYaml = configMap.data[`${configMapName}.yaml`];
      const appConfigObj = yaml.load(appConfigYaml) as any;

      appConfigObj.app.title = newTitle;
      configMap.data[`${configMapName}.yaml`] = yaml.dump(appConfigObj);

      delete configMap.metadata.creationTimestamp;

      await this.coreV1Api.replaceNamespacedConfigMap(
        configMapName,
        namespace,
        configMap,
      );
      console.log("ConfigMap updated successfully.");
    } catch (error) {
      console.error("Error updating ConfigMap:", error);
      throw new Error("Failed to update ConfigMap");
    }
  }

  async updateSecret(secretName: string, namespace: string, patch: object) {
    try {
      const options = {
        headers: {
          "Content-type": k8s.PatchUtils.PATCH_FORMAT_JSON_MERGE_PATCH,
        },
      };
      logger.info(`Updating secret ${secretName} in namespace ${namespace}`);
      await this.coreV1Api.patchNamespacedSecret(
        secretName,
        namespace,
        patch,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        options,
      );
    } catch (e) {
      logger.error(e.statusCode, e.body.message);
      throw e;
    }
  }

  async createCongifmap(namespace: string, body: V1ConfigMap) {
    try {
      logger.info(
        `Creating configmap ${body.metadata.name} in namespace ${namespace}`,
      );
      return await this.coreV1Api.createNamespacedConfigMap(namespace, body);
    } catch (err) {
      logger.error(err.body.message);
      throw err;
    }
  }

  async deleteNamespaceAndWait(namespace: string) {
    const watch = new k8s.Watch(this.kc);
    try {
      await this.coreV1Api.deleteNamespace(namespace);
      logger.info(`Namespace '${namespace}' deletion initiated.`);

      await new Promise<void>((resolve, reject) => {
        watch.watch(
          `/api/v1/namespaces?watch=true&fieldSelector=metadata.name=${namespace}`,
          {},
          (type) => {
            if (type === "DELETED") {
              logger.info(`Namespace '${namespace}' has been deleted.`);
              resolve();
            }
          },
          (err) => {
            if (err && err.statusCode === 404) {
              // Namespace was already deleted or does not exist
              logger.info(`Namespace '${namespace}' is already deleted.`);
              resolve();
            } else {
              reject(err);
              throw err;
            }
          },
        );
      });
    } catch (err) {
      logger.error("Error deleting or waiting for namespace deletion:", err);
      throw err;
    }
  }

  async createNamespaceIfNotExists(namespace: string) {
    const nsList = await this.coreV1Api.listNamespace();
    const ns = nsList.body.items.map((ns) => ns.metadata.name);
    if (ns.includes(namespace)) {
      logger.info(`Delete and re-create namespace ${namespace}`);
      try {
        await this.deleteNamespaceAndWait(namespace);
      } catch (err) {
        logger.error(err);
        throw err;
      }
    }

    try {
      const createNamespaceRes = await this.coreV1Api.createNamespace({
        metadata: {
          name: namespace,
        },
      });
      logger.info(`Created namespace ${createNamespaceRes.body.metadata.name}`);
    } catch (err) {
      logger.error(err.body.message);
      throw err;
    }
  }

  async createSecret(secret: k8s.V1Secret, namespace: string) {
    try {
      logger.info(
        `Creating secret ${secret.metadata.name} in namespace ${namespace}`,
      );
      await this.coreV1Api.createNamespacedSecret(namespace, secret);
    } catch (err) {
      logger.error(err.body.message);
      throw err;
    }
  }

  async waitForDeploymentReady(
    deploymentName: string,
    namespace: string,
    expectedReplicas: number,
    timeout: number = 300000, // 5 minutes
    checkInterval: number = 10000, // 10 seconds
  ) {
    const start = Date.now();
    const labelSelector =
      "app.kubernetes.io/component=backstage,app.kubernetes.io/instance=rhdh,app.kubernetes.io/name=backstage";

    while (Date.now() - start < timeout) {
      try {
        // Check deployment status
        const response = await this.appsApi.readNamespacedDeployment(
          deploymentName,
          namespace,
        );

        const availableReplicas = response.body.status?.availableReplicas || 0;
        const conditions = response.body.status?.conditions || [];

        console.log(`Available replicas: ${availableReplicas}`);
        console.log(
          "Deployment conditions:",
          JSON.stringify(conditions, null, 2),
        );

        // Log pod conditions using label selector
        await this.logPodConditions(namespace, labelSelector);

        // Check if the expected replicas match
        if (availableReplicas === expectedReplicas) {
          console.log(
            `Deployment ${deploymentName} is ready with ${availableReplicas} replicas.`,
          );
          return;
        }

        console.log(
          `Waiting for ${deploymentName} to reach ${expectedReplicas} replicas, currently has ${availableReplicas}.`,
        );
      } catch (error) {
        console.error(`Error checking deployment status: ${error}`);
      }

      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    throw new Error(
      `Deployment ${deploymentName} did not become ready in time.`,
    );
  }

  async restartDeployment(deploymentName: string, namespace: string) {
    try {
      console.log(`Scaling down deployment ${deploymentName} to 0 replicas.`);
      await this.logPodConditions(namespace);
      await this.scaleDeployment(deploymentName, namespace, 0);

      await this.waitForDeploymentReady(deploymentName, namespace, 0);

      console.log(`Scaling up deployment ${deploymentName} to 1 replica.`);
      await this.scaleDeployment(deploymentName, namespace, 1);

      await this.waitForDeploymentReady(deploymentName, namespace, 1);

      console.log(
        `Restart of deployment ${deploymentName} completed successfully.`,
      );
    } catch (error) {
      console.error(
        `Error during deployment restart: Deployment '${deploymentName}' in namespace '${namespace}'.`,
      );
      await this.logPodConditions(namespace);
      await this.logDeploymentEvents(deploymentName, namespace);
      throw new Error(
        `Failed to restart deployment '${deploymentName}' in namespace '${namespace}'.`,
      );
    }
  }

  async logPodConditions(namespace: string, labelSelector?: string) {
    const selector =
      labelSelector ||
      "app.kubernetes.io/component=backstage,app.kubernetes.io/instance=rhdh,app.kubernetes.io/name=backstage";

    try {
      const response = await this.coreV1Api.listNamespacedPod(
        namespace,
        undefined,
        undefined,
        undefined,
        undefined,
        selector,
      );

      if (response.body.items.length === 0) {
        console.warn(`No pods found for selector: ${selector}`);
      }

      for (const pod of response.body.items) {
        console.log(`Pod: ${pod.metadata?.name}`);
        console.log(
          "Conditions:",
          JSON.stringify(pod.status?.conditions, null, 2),
        );
      }
    } catch (error) {
      console.error(
        `Error while retrieving pod conditions for selector '${selector}':`,
        error,
      );
    }
  }

  async logDeploymentEvents(deploymentName: string, namespace: string) {
    try {
      const eventsResponse = await this.coreV1Api.listNamespacedEvent(
        namespace,
        undefined,
        undefined,
        undefined,
        `involvedObject.name=${deploymentName}`,
      );

      console.log(
        `Events for deployment ${deploymentName}: ${JSON.stringify(
          eventsResponse.body.items.map((event) => ({
            message: event.message,
            reason: event.reason,
            type: event.type,
          })),
          null,
          2,
        )}`,
      );
    } catch (error) {
      console.error(
        `Error retrieving events for deployment ${deploymentName}: ${error}`,
      );
    }
  }
}
