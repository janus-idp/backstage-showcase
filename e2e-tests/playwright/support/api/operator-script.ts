import { runShellCmd } from "../../utils/helper";
import fs from "fs";
import { LOGGER } from "../../utils/logger";

export class OperatorScript {
  readonly operatorProjectPath = `${process.cwd()}/e2e-tests/operator-project`;
  readonly scriptPath = `${this.operatorProjectPath}/.rhdh/scripts/install-rhdh-catalog-source.sh`;
  readonly operatorRepo =
    "https://github.com/redhat-developer/rhdh-operator.git";
  rhdhUrl: string;

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
    const command = `oc get crd/backstages.rhdh.redhat.com -n "${namespace}"; oc get crd/backstages.rhdh.redhat.com -n rhdh-operator`;

    await runShellCmd(command)
      .then(async (e) => {
        console.log(e);
        await new Promise((resolve) => setTimeout(resolve, 30_000));
      })
      .catch((e) => {
        throw new Error(`Error during Backstage CRD installation: ${e}`);
      });
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

      const regex =
        /https:\/\/backstage-developer-hub-rhdh-operator\.[a-zA-Z0-9-]+\.devcluster\.openshift\.com/;

      const match = message.match(regex);
      if (match) {
        console.log("Extracted URL:", match[0]);
        this.rhdhUrl = match[0];
      } else {
        console.log("URL not found");
      }
    } catch (e) {
      LOGGER.error(e);
      throw Error(e);
    }
  }
}
