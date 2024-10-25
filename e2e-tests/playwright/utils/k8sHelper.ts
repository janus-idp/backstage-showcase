import k8s, { V1ConfigMap } from "@kubernetes/client-node";
import { logger } from "./Logger";

export class kubeCLient {
  coreV1Api: k8s.CoreV1Api;
  appsApi: k8s.AppsV1Api;
  kc: k8s.KubeConfig;

  constructor() {
    logger.info(`Initializing Kubernetes API client`);
    try {
      this.kc = new k8s.KubeConfig();
      this.kc.loadFromDefault();
      this.appsApi = this.kc.makeApiClient(k8s.AppsV1Api);
      this.coreV1Api = this.kc.makeApiClient(k8s.CoreV1Api);
    } catch (e) {
      logger.info(e);
      throw e;
    }
  }

  async getCongifmap(configmapName: string, namespace: string) {
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

  async updateCongifmap(
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
    timeout: number = 100000,
    checkInterval: number = 10000,
  ) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      try {
        const response = await this.appsApi.readNamespacedDeployment(
          deploymentName,
          namespace,
        );
        const availableReplicas = response.body.status?.availableReplicas || 0;

        if (availableReplicas === expectedReplicas) {
          console.log(
            `Deployment ${deploymentName} is ready with ${availableReplicas} replicas.`,
          );
          return;
        }

        console.log(
          `Waiting for ${deploymentName} to reach ${expectedReplicas} replicas, currently has ${availableReplicas}.`,
        );
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
      } catch (error) {
        console.error(`Error checking deployment status: ${error}`);
        throw error;
      }
    }

    throw new Error(
      `Deployment ${deploymentName} did not become ready in time.`,
    );
  }

  async restartDeployment(deploymentName: string, namespace: string) {
    await this.scaleDeployment(deploymentName, namespace, 0);
    await this.waitForDeploymentReady(deploymentName, namespace, 0);

    await this.scaleDeployment(deploymentName, namespace, 1);
    await this.waitForDeploymentReady(deploymentName, namespace, 1);
  }
}
