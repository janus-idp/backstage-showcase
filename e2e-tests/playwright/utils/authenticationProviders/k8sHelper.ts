import k8s from '@kubernetes/client-node';
import { logger } from './Logger';

export class kubeCLient {
  coreV1Api: k8s.CoreV1Api;
  appsApi: k8s.AppsV1Api;
  kc: k8s.KubeConfig;

  constructor() {
    this.kc = new k8s.KubeConfig();
    this.kc.loadFromDefault();
    this.appsApi = this.kc.makeApiClient(k8s.AppsV1Api);
    this.coreV1Api = this.kc.makeApiClient(k8s.CoreV1Api);
  }

  async getCongifmap(configmapName: string, namespace: string) {
    return await this.coreV1Api.readNamespacedConfigMap(
      configmapName,
      namespace,
    );
  }

  async getSecret(secretName: string, namespace: string) {
    return await this.coreV1Api.readNamespacedSecret(secretName, namespace);
  }

  async updateCongifmap(
    configmapName: string,
    namespace: string,
    patch: object,
  ) {
    try {
      const options = {
        headers: { 'Content-type': k8s.PatchUtils.PATCH_FORMAT_JSON_PATCH },
      };

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
      console.log(e.statusCode, e);
    }
  }

  async updateSecret(secretName: string, namespace: string, patch: object) {
    try {
      const options = {
        headers: {
          'Content-type': k8s.PatchUtils.PATCH_FORMAT_JSON_MERGE_PATCH,
        },
      };

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
      console.log(e.statusCode, e);
    }
  }

  async createCongifmap(namespace: string, body: object) {
    return await this.coreV1Api.createNamespacedConfigMap(namespace, body);
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
          type => {
            if (type === 'DELETED') {
              console.log(`Namespace '${namespace}' has been deleted.`);
              resolve();
            }
          },
          err => {
            if (err && err.statusCode === 404) {
              // Namespace was already deleted or does not exist
              console.log(`Namespace '${namespace}' is already deleted.`);
              resolve();
            } else {
              reject(err);
            }
          },
        );
      });
    } catch (err) {
      console.error('Error deleting or waiting for namespace deletion:', err);
    }
  }

  async createNamespaceIfNotExists(namespace: string) {
    const nsList = await this.coreV1Api.listNamespace();
    const ns = nsList.body.items.map(ns => ns.metadata.name);
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
      await this.coreV1Api.createNamespacedSecret(namespace, secret);
    } catch (err) {
      logger.error(err.body);
      throw err;
    }
  }
}
