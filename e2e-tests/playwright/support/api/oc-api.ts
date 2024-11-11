import { request } from "@playwright/test";

export class OcApi {
  private url: string;
  constructor(url: string) {
    this.url = url;
  }

  async isAlive() {
    const context = await request.newContext({
      baseURL: this.url + "/apis",
      extraHTTPHeaders: {
        //Authorization: `Bearer ${process.env.K8S_CLUSTER_TOKEN}`,
      },
    });
    const res = await context.get("");
    const body = await res.json();
    console.log(body);
    return res.ok;
  }

  async listAvailableOperators(namespace = "openshift-marketplace") {
    const context = await request.newContext({
      baseURL: this.url,
      extraHTTPHeaders: {
        //Authorization: `Bearer `,
        "Content-Type": "application/json",
      },
    });

    try {
      const catalogSourceEndpoint = `/apis/operators.coreos.com/v1alpha1/namespaces/${namespace}/catalogsources`;
      const catalogRes = await context.get(catalogSourceEndpoint);

      if (!catalogRes.ok) {
        console.error(
          `Failed to fetch catalog sources: ${await catalogRes.text()}`,
        );
        return;
      }

      const catalogSources = await catalogRes.json();
      console.log("Available Catalog Sources:", catalogSources);

      const clusterServiceVersionEndpoint = `/apis/operators.coreos.com/v1alpha1/namespaces/rhdh-nil/clusterserviceversions`;
      const csvRes = await context.get(clusterServiceVersionEndpoint);

      if (!csvRes.ok) {
        console.error(
          `Failed to fetch ClusterServiceVersions: ${await csvRes.text()}`,
        );
        return;
      }

      const clusterServiceVersions = await csvRes.json();
      console.log(
        "Available Operators:",
        clusterServiceVersions.items.map(
          (item: {
            metadata: { name: string };
            spec: { version: string; description: string; provider: string };
          }) => ({
            name: item.metadata.name,
            version: item.spec.version,
            description: item.spec.description,
            provider: item.spec.provider,
          }),
        ),
      );
    } catch (error) {
      console.error("Error listing available operators:", error);
    }
  }

  async installDeveloperHubOperator(namespace = "rhdh-nil") {
    const operatorName = "rhdh"; // As per the URL `pkg=rhdh`
    const catalogSourceName = "rhdh-fast"; // Based on `catalog=rhdh-fast` in the URL
    const channel = "fast"; // Based on `channel=fast` in the URL

    const context = await request.newContext({
      baseURL: this.url,
      extraHTTPHeaders: {
        Authorization: `Bearer `,
        "Content-Type": "application/json",
      },
    });

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
      const res = await context.post(subscriptionEndpoint, {
        data: JSON.stringify(subscriptionPayload),
      });

      if (res.ok) {
        console.log(
          `Developer Hub Operator subscription created in namespace: ${namespace}`,
        );
      } else {
        console.error(`Failed to create subscription: ${await res.text()}`);
      }
      console.log(await res.json());
    } catch (error) {
      console.error("Error installing the operator:", error);
    }
  }
}
