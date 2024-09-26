import { AppsV1Api, CoreV1Api, KubeConfig } from '@kubernetes/client-node';
import * as yaml from 'js-yaml';

export class KubernetesUtils {
  private k8sApi: CoreV1Api;
  private appsApi: AppsV1Api;

  constructor(namespace: string) {
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
          name: namespace,
          user: 'ci-user',
          cluster: 'my-openshift-cluster',
        },
      ],
      currentContext: namespace,
    });

    this.k8sApi = kc.makeApiClient(CoreV1Api);
    this.appsApi = kc.makeApiClient(AppsV1Api);
  }

  // Updates the title in the ConfigMap
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
      throw new Error('Failed to update ConfigMap');
    }
  }

  // Scale the deployment
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
        undefined, // pretty
        undefined, // dryRun
        undefined, // fieldManager
        undefined, // fieldValidation
        undefined, // force
        {
          headers: { 'Content-Type': 'application/strategic-merge-patch+json' },
        }, // options (headers)
      );
      console.log(`Deployment scaled to ${replicas} replicas.`);
    } catch (error) {
      console.error('Error scaling deployment:', error);
      throw new Error(`Failed to scale deployment to ${replicas} replicas`);
    }
  }

  // Checks if the deployment is ready with the expected number of replicas
  async waitForDeploymentReady(
    deploymentName: string,
    namespace: string,
    expectedReplicas: number,
    timeout: number = 3100000,
    checkInterval: number = 50000,
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
        throw new Error(
          `Failed to check deployment status for ${deploymentName}`,
        );
      }
    }

    throw new Error(
      `Deployment ${deploymentName} did not become ready in time.`,
    );
  }

  // Restarts the deployment
  async restartDeployment(deploymentName: string, namespace: string) {
    try {
      await this.scaleDeployment(deploymentName, namespace, 0);
      await this.waitForDeploymentReady(deploymentName, namespace, 0);
    } catch (error) {
      console.error('Error scaling down to 0 replicas:', error);
      throw new Error(
        'Failed to scale deployment to 0 replicas. Aborting restart.',
      );
    }

    try {
      await this.scaleDeployment(deploymentName, namespace, 1);
      await this.waitForDeploymentReady(deploymentName, namespace, 1);
    } catch (error) {
      console.error('Error scaling up to 1 replica:', error);
      throw new Error('Failed to scale deployment back to 1 replica.');
    }
  }
}
