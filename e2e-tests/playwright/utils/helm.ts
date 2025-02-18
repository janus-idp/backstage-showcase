import { runShellCmd } from "./helper";
import { KubeClient } from "./kube-client";
import { LOGGER } from "./logger";

export class HelmActions {
  static async upgradeHelmChartWithWait(
    release: string,
    chart: string,
    namespace: string,
    values: string,
    chartVersion: string,
    quayRepo: string,
    tagName: string,
    flags: Array<string>,
  ) {
    LOGGER.info(`Deleting any existing helm release ${release}`);
    await HelmActions.deleteHelmReleaseWithWait(release, namespace);

    LOGGER.info(`Upgrading helm release ${release}`);
    const upgradeOutput = await runShellCmd(`helm upgrade \
      -i ${release} ${chart}  \
      --wait --timeout 300s -n ${namespace} \
      --values ${values} \
      --version "${chartVersion}" --set upstream.backstage.image.repository="${quayRepo}" --set upstream.backstage.image.tag="${tagName}" \
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
      message: `Applied configuration for release upgrade: `,
      dump: configmap.body.data,
    });

    //TBD: get dynamic plugins configmap
  }

  static async deleteHelmReleaseWithWait(release: string, namespace: string) {
    LOGGER.info(`Deleting release ${release} in namespace ${namespace}`);
    const result = await runShellCmd(
      `helm uninstall ${release} --wait --timeout 300s -n ${namespace} || true`,
    );
    LOGGER.log({
      level: "info",
      message: `Release delete returned: `,
      dump: result,
    });
    return result;
  }

  static async installHelmRelease(namespace: string) {
    await runShellCmd(
      `helm repo add openshift-helm-charts https://charts.openshift.io/`,
    );
    await runShellCmd(
      `helm show values openshift-helm-charts/redhat-developer-hub --version 1.0.0-1 > values.yaml`,
    );

    const list = await runShellCmd(`helm list -n rhdh-nil`);
    console.log(list);

    await runShellCmd(
      `helm upgrade -i rhdh -f values.yaml openshift-helm-charts/redhat-developer-hub \
      --wait --timeout 300s -n ${namespace} \
      --set global.clusterRouterBase=apps.alxdq5slv4a572c9df.eastus.aroapp.io`,
    );
  }
}
