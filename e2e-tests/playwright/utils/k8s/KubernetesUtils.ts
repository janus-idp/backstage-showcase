import { AppsV1Api, CoreV1Api, KubeConfig } from '@kubernetes/client-node';
import * as yaml from 'js-yaml';

export class KubernetesUtils {
  private k8sApi: CoreV1Api;
  private appsApi: AppsV1Api;

  constructor() {
    const kc = new KubeConfig();
    kc.loadFromOptions({
      clusters: [
        {
          name: 'my-openshift-cluster',
          server: process.env.K8S_CLUSTER_URL,
          skipTLSVerify: true,
        },
      ],
      users: [
        {
          name: 'ci-user',
          token: process.env.K8S_CLUSTER_TOKEN,
        },
      ],
      contexts: [
        {
          name: process.env.NAME_SPACE,
          user: 'ci-user',
          cluster: 'my-openshift-cluster',
        },
      ],
      currentContext: process.env.NAME_SPACE,
    });

    this.k8sApi = kc.makeApiClient(CoreV1Api);
    this.appsApi = kc.makeApiClient(AppsV1Api);
  }

  async updateConfigMapTitle(
    configMapName: string,
    namespace: string,
    newTitle: string,
  ) {
    try {
      const configMapResponse = await this.k8sApi.readNamespacedConfigMap(
        configMapName,
        namespace,
      );
      const configMap = configMapResponse.body;

      const appConfigYaml = configMap.data[`${configMapName}.yaml`];
      const appConfigObj = yaml.load(appConfigYaml) as any;

      appConfigObj.app.title = newTitle;
      configMap.data[`${configMapName}.yaml`] = yaml.dump(appConfigObj);

      delete configMap.metadata.creationTimestamp;

      await this.k8sApi.replaceNamespacedConfigMap(
        configMapName,
        namespace,
        configMap,
      );
      console.log('ConfigMap updated successfully.');
    } catch (error) {
      console.error('Error updating ConfigMap:', error);
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
        {
          headers: { 'Content-Type': 'application/strategic-merge-patch+json' },
        },
      );
      console.log(`Deployment scaled to ${replicas} replicas.`);
    } catch (error) {
      console.error('Error scaling deployment:', error);
    }
  }

  async waitForDeploymentReady(
    deploymentName: string,
    namespace: string,
    expectedReplicas: number,
    timeout: number = 60000,
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
        await new Promise(resolve => setTimeout(resolve, checkInterval));
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
