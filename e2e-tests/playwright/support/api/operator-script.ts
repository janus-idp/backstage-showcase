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
    const command = `
      echo "Verifying creation of crd/backstages.rhdh.redhat.com in namespace: ${namespace}"
      while ! oc get crd/backstages.rhdh.redhat.com -n "${namespace}"; do
        echo "Waiting for Backstage CRD to be created..."
        sleep 20
      done
      echo "Backstage CRD is created."
    `;
    try {
      await runShellCmd(command, 600_000);
      console.log("Backstage CRD installation confirmed.");
    } catch (error) {
      console.log(error);
      throw new Error(`Error during Backstage CRD installation: ${error}`);
    }
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
