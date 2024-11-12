import { request, APIRequestContext } from "@playwright/test";

interface OperatorInfo {
  name: string;
  version: string;
  description: string;
  provider: string;
}

interface OperatorStatus {
  name: string;
  phase: string;
  reason: string;
  message: string;
}

export class OcApi {
  private readonly url: string;
  private readonly namespace: string;
  private readonly headers: Record<string, string>;
  private readonly context: Promise<APIRequestContext>;

  constructor(namespace: string) {
    this.url = process.env.K8S_CLUSTER_URL;
    this.headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.K8S_CLUSTER_TOKEN}`,
    };

    this.context = request.newContext({
      baseURL: this.url,
      extraHTTPHeaders: this.headers,
    });
    this.namespace = namespace;
  }

  async createNamespace(namespaceName = this.namespace): Promise<void> {
    const _context = await this.context;

    const namespacePayload = {
      apiVersion: "v1",
      kind: "Namespace",
      metadata: {
        name: namespaceName,
      },
    };

    const endpoint = `/api/v1/namespaces`;

    try {
      const response = await _context.post(endpoint, {
        data: JSON.stringify(namespacePayload),
      });

      if (!response.ok()) {
        const errorText = await response.text();
        throw new Error(`Failed to create namespace: ${errorText}`);
      }

      console.log(`Namespace ${namespaceName} created successfully.`);
    } catch (error) {
      console.error(`Error creating namespace ${namespaceName}:`, error);
      throw error;
    }
  }

  async isAlive(): Promise<boolean> {
    const _context = await this.context;
    const res = await _context.get("/apis");
    console.log("API Response Status:", res.status());
    return res.ok();
  }

  async listAvailableOperators(
    namespace = "openshift-marketplace",
  ): Promise<OperatorInfo[]> {
    const _context = await this.context;

    const clusterServiceVersionEndpoint = `/apis/operators.coreos.com/v1alpha1/namespaces/${namespace}/clusterserviceversions`;
    const csvRes = await _context.get(clusterServiceVersionEndpoint);

    if (!csvRes.ok()) {
      const errorText = await csvRes.text();
      throw new Error(`Failed to fetch ClusterServiceVersions: ${errorText}`);
    }

    const clusterServiceVersions = await csvRes.json();
    const operators: OperatorInfo[] = clusterServiceVersions.items.map(
      (item: {
        metadata: { name: string };
        spec: {
          displayName: string;
          version: string;
          description: string;
          provider: { name: string };
        };
      }) => ({
        name: item.spec.displayName || item.metadata.name,
        version: item.spec.version,
        description: item.spec.description,
        provider: item.spec.provider.name,
      }),
    );

    return operators;
  }

  async listInstalledOperators(
    namespace = this.namespace,
  ): Promise<OperatorInfo[]> {
    const _context = await this.context;

    const clusterServiceVersionEndpoint = `/apis/operators.coreos.com/v1alpha1/namespaces/${namespace}/clusterserviceversions`;
    const csvRes = await _context.get(clusterServiceVersionEndpoint);

    if (!csvRes.ok()) {
      const errorText = await csvRes.text();
      throw new Error(`Failed to fetch installed operators: ${errorText}`);
    }

    const clusterServiceVersions = await csvRes.json();
    const operators: OperatorInfo[] = clusterServiceVersions.items.map(
      (item: {
        metadata: { name: string };
        spec: {
          displayName: string;
          version: string;
          description: string;
          provider: { name: string };
        };
      }) => ({
        name: item.spec.displayName || item.metadata.name,
        version: item.spec.version,
        description: item.spec.description,
        provider: item.spec.provider.name,
      }),
    );

    return operators;
  }

  async getOperatorStatus(
    operatorName: string,
    namespace = this.namespace,
  ): Promise<OperatorStatus> {
    const _context = await this.context;

    const csvEndpoint = `/apis/operators.coreos.com/v1alpha1/namespaces/${namespace}/clusterserviceversions/${operatorName}`;
    const res = await _context.get(csvEndpoint);

    if (!res.ok()) {
      const errorText = await res.text();
      throw new Error(`Failed to get operator status: ${errorText}`);
    }

    const csv = await res.json();
    const status = csv.status;

    return {
      name: csv.metadata.name,
      phase: status.phase,
      reason: status.reason,
      message: status.message,
    };
  }

  async getSubscription(operatorName: string, namespace = this.namespace) {
    const _context = await this.context;
    const subscriptionEndpoint = `/apis/operators.coreos.com/v1alpha1/namespaces/${namespace}/subscriptions/${operatorName}`;
    const res = await _context.get(subscriptionEndpoint);

    if (!res.ok()) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch subscription: ${errorText}`);
    }

    return await res.json();
  }

  async getInstallPlan(operatorName: string, namespace = this.namespace) {
    const subscription = await this.getSubscription(operatorName, namespace);
    const installPlanName = subscription.status?.installplan?.name;

    if (!installPlanName) {
      throw new Error(`No InstallPlan found for operator ${operatorName}`);
    }

    const _context = await this.context;
    const installPlanEndpoint = `/apis/operators.coreos.com/v1alpha1/namespaces/${namespace}/installplans/${installPlanName}`;
    const res = await _context.get(installPlanEndpoint);

    if (!res.ok()) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch InstallPlan: ${errorText}`);
    }

    return await res.json();
  }

  /**
   * Installs the Developer Hub Operator in the specified namespace.
   */
  async installDeveloperHubOperator(namespace = this.namespace): Promise<void> {
    const _context = await this.context;
    const operatorName = "rhdh";
    const catalogSourceName = "rhdh-fast";
    const channel = "fast";

    const subscriptionPayload = {
      apiVersion: "operators.coreos.com/v1alpha1",
      kind: "Subscription",
      metadata: {
        name: operatorName,
        namespace: namespace,
      },
      spec: {
        channel: channel,
        name: operatorName,
        source: catalogSourceName,
        sourceNamespace: "openshift-marketplace",
        installPlanApproval: "Automatic",
      },
    };

    const subscriptionEndpoint = `/apis/operators.coreos.com/v1alpha1/namespaces/${namespace}/subscriptions`;

    try {
      const response = await _context.post(subscriptionEndpoint, {
        data: JSON.stringify(subscriptionPayload),
      });

      if (!response.ok()) {
        const errorText = await response.text();
        throw new Error(
          `Response had code ${response.status()}. Failed to create subscription: ${errorText}`,
        );
      }

      console.log(
        `Developer Hub Operator subscription created in namespace: ${namespace}`,
      );
    } catch (e) {
      console.error("Error installing Developer Hub Operator:", e);
    }
  }

  async upgradeOperator(
    operatorName: string,
    newChannel?: string,
    newStartingCSV?: string,
    namespace = this.namespace,
  ): Promise<void> {
    const _context = await this.context;

    const subscriptionEndpoint = `/apis/operators.coreos.com/v1alpha1/namespaces/${namespace}/subscriptions/${operatorName}`;

    const patchData: any = {};
    if (newChannel) {
      patchData.spec = { ...(patchData.spec || {}), channel: newChannel };
    }
    if (newStartingCSV) {
      patchData.spec = {
        ...(patchData.spec || {}),
        startingCSV: newStartingCSV,
      };
    }

    if (Object.keys(patchData).length === 0) {
      console.log("No updates specified for the operator upgrade.");
      return;
    }

    const patchRes = await _context.patch(subscriptionEndpoint, {
      data: JSON.stringify(patchData),
      headers: {
        "Content-Type": "application/merge-patch+json",
      },
    });

    if (!patchRes.ok()) {
      const errorText = await patchRes.text();
      throw new Error(`Failed to upgrade operator: ${errorText}`);
    }

    console.log(
      `Operator ${operatorName} upgraded successfully in namespace ${namespace}`,
    );
  }

  async deleteOperator(
    operatorName: string,
    namespace = this.namespace,
  ): Promise<void> {
    const _context = await this.context;

    try {
      // Delete the Subscription
      const subscriptionEndpoint = `/apis/operators.coreos.com/v1alpha1/namespaces/${namespace}/subscriptions/${operatorName}`;
      const subRes = await _context.delete(subscriptionEndpoint);

      if (!subRes.ok()) {
        const errorText = await subRes.text();
        throw new Error(`Failed to delete Subscription: ${errorText}`);
      }

      console.log(`Subscription ${operatorName} deleted successfully.`);

      const csvEndpoint = `/apis/operators.coreos.com/v1alpha1/namespaces/${namespace}/clusterserviceversions`;
      const csvListRes = await _context.get(csvEndpoint);

      if (!csvListRes.ok()) {
        const errorText = await csvListRes.text();
        throw new Error(`Failed to list ClusterServiceVersions: ${errorText}`);
      }

      const csvList = await csvListRes.json();
      const csvItems = csvList.items;

      for (const csv of csvItems) {
        if (csv.metadata.name.startsWith(operatorName)) {
          const csvName = csv.metadata.name;
          const csvDeleteEndpoint = `${csvEndpoint}/${csvName}`;
          const csvDeleteRes = await _context.delete(csvDeleteEndpoint);

          if (!csvDeleteRes.ok()) {
            const errorText = await csvDeleteRes.text();
            console.warn(`Failed to delete CSV ${csvName}: ${errorText}`);
          } else {
            console.log(`CSV ${csvName} deleted successfully.`);
          }
        }
      }

      const operatorGroupEndpoint = `/apis/operators.coreos.com/v1/namespaces/${namespace}/operatorgroups/${operatorName}`;
      const ogDeleteRes = await _context.delete(operatorGroupEndpoint);

      if (!ogDeleteRes.ok()) {
        const errorText = await ogDeleteRes.text();
        console.warn(
          `Failed to delete OperatorGroup ${operatorName}: ${errorText}`,
        );
      } else {
        console.log(`OperatorGroup ${operatorName} deleted successfully.`);
      }

      console.log(
        `Operator ${operatorName} deleted successfully from namespace ${namespace}.`,
      );
    } catch (error) {
      console.error(`Error deleting operator ${operatorName}:`, error);
    }
  }
}
