import { runShellCmd } from "./helper";
import { KubeClient } from "./kube-client";
import { LOGGER } from "./logger";

export class HelmActions {
  static async upgradeHelmChartWithWait(
    RELEASE: string,
    CHART: string,
    NAMESPACE: string,
    VALUES: string,
    CHART_VERSION: string,
    QUAY_REPO: string,
    TAG_NAME: string,
    FLAGS: Array<string>,
  ) {
    LOGGER.info(`Deleting any exisitng helm release ${RELEASE}`);
    await HelmActions.deleteHelmReleaseWithWait(RELEASE, NAMESPACE);

    LOGGER.info(`Upgrading helm release ${RELEASE}`);
    const upgradeOutput = await runShellCmd(`helm upgrade \
      -i ${RELEASE} ${CHART}  \
      --wait --timeout 300s -n ${NAMESPACE} \
      --values ${VALUES} \
      --version "${CHART_VERSION}" --set upstream.backstage.image.repository="${QUAY_REPO}" --set upstream.backstage.image.tag="${TAG_NAME}" \
      --set global.clusterRouterBase=${process.env.K8S_CLUSTER_ROUTER_BASE}  \
      ${FLAGS.join(" ")}`);

    LOGGER.log({
      level: "info",
      message: `Release upgrade returned: `,
      dump: upgradeOutput,
    });

    const configmap = await new KubeClient().getConfigMap(
      `${RELEASE}-backstage-app-config`,
      NAMESPACE,
    );
    LOGGER.log({
      level: "info",
      message: `Applied confguration for release upgrade: `,
      dump: configmap.body.data,
    });

    //TBD: get dynamic plugins configmap
  }

  static async deleteHelmReleaseWithWait(RELEASE: string, NAMESPACE: string) {
    LOGGER.info(`Deleting release ${RELEASE} in namespace ${NAMESPACE}`);
    const result = await runShellCmd(
      `helm uninstall ${RELEASE} --wait --timeout 300s -n ${NAMESPACE} --ignore-not-found`,
    );
    LOGGER.log({
      level: "info",
      message: `Release delete returned: `,
      dump: result,
    });
    return result;
  }
}
