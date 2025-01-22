import { runShellCmd } from "../../utils/helper";
import fs from "fs";
import { LOGGER } from "../../utils/logger";

export class OperatorScript {
  readonly operatorProjectPath = `${process.cwd()}/e2e-tests/operator-project`;
  readonly scriptPath = `${this.operatorProjectPath}/.rhdh/scripts/install-rhdh-catalog-source.sh`;
  readonly operatorRepo =
    "https://github.com/redhat-developer/rhdh-operator.git";

  private constructor() {}
  public static async build(
    namespace = "default",
    server = process.env.K8S_CLUSTER_URL,
    user = "ci-user",
    token = process.env.K8S_CLUSTER_TOKEN,
  ) {
    const instance = new OperatorScript();

    if (!fs.existsSync(instance.operatorProjectPath))
      await runShellCmd(
        `git clone ${instance.operatorRepo} ${instance.operatorProjectPath}`,
      );

    await runShellCmd(
      `kubectl config set-cluster my-openshift-cluster \
      --server=${server} \
      --insecure-skip-tls-verify=true`,
    );
    await runShellCmd(
      `kubectl config set-credentials ${user} --token=${token}`,
    );
    await runShellCmd(
      `kubectl config set-context default-context \
       --cluster=my-openshift-cluster \
       --user=${user} \
       --namespace=${namespace}`,
    );
    await runShellCmd(`kubectl config use-context default-context`);
    return instance;
  }

  getDeploymentYamlPath(): string {
    return `${process.cwd()}/playwright/data/backstage-operator.yaml`;
  }

  async installBackstageCRD(namespace = "default") {
    await runShellCmd(`
      timeout 300 bash -c '
      while ! oc get crd/backstages.rhdh.redhat.com -n "${namespace}" >/dev/null 2>&1; do
          echo "Waiting for Backstage CRD to be created..."
          sleep 20
      done
      echo "Backstage CRD is created."
      ' || echo "Error: Timed out waiting for Backstage CRD creation."
    `);
  }

  // https://github.com/redhat-developer/rhdh-operator/blob/main/.rhdh/scripts/install-rhdh-catalog-source.sh
  async run(options: string[]) {
    try {
      const result = await runShellCmd(
        `${this.scriptPath} ${options.join(" ")}`,
      );
      const message = result + "";
      LOGGER.info(message);
      console.log(message);
    } catch (e) {
      LOGGER.error(e);
      throw Error(e);
    }

    await new Promise((resolve) => setTimeout(resolve, 60_000));
    try {
      const result = await runShellCmd(
        `oc apply -f ${this.getDeploymentYamlPath()}`,
      );
      const message = result + "";
      LOGGER.info(message);
      console.log(message);
    } catch (e) {
      LOGGER.error(e);
      throw Error(e);
    }
  }
}
