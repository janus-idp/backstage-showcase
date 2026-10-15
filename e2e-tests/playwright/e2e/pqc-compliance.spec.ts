import { test, expect } from "@support/coverage/test";

import {
  BACKSTAGE_BACKEND_CONTAINER,
  getRhdhDeploymentName,
  KubeClient,
} from "../utils/kube-client";
import {
  buildGitlabFetchProbeCommand,
  buildGitlabSClientCommand,
  buildOpenSslVersionCommand,
  isHybridMlKemGroup,
  parseOpenSslSClientOutput,
} from "../utils/pqc/tls-ml-kem-probe";

test.describe("PQC Compliance Validation", () => {
  test.beforeAll(({}, testInfo) => {
    testInfo.annotations.push({
      type: "component",
      description: "pqc",
    });
  });

  test("hub openssl negotiates hybrid ML-KEM with AUTH_PROVIDERS_GITLAB_HOST", async ({}, testInfo) => {
    const host = requireEnv("AUTH_PROVIDERS_GITLAB_HOST");
    const namespace = requireEnv("NAME_SPACE");
    const deploymentName = getRhdhDeploymentName();
    const kube = new KubeClient();

    const podName = await findReadyHubPod(kube, namespace, deploymentName);
    console.log(`[PQC] Peer GitLab host: ${host}`);
    console.log(`[PQC] Hub pod: ${namespace}/${podName}`);

    const versionResult = await kube.execPodCommand(
      podName,
      namespace,
      BACKSTAGE_BACKEND_CONTAINER,
      buildOpenSslVersionCommand(),
    );
    const opensslVersion = `${versionResult.stdout}${versionResult.stderr}`.trim();
    console.log(`[PQC] OpenSSL under test: ${opensslVersion}`);
    expect(opensslVersion.length, "openssl version output should not be empty").toBeGreaterThan(0);

    const sClientCommand = buildGitlabSClientCommand(host);
    const sClientResult = await kube.execPodCommand(
      podName,
      namespace,
      BACKSTAGE_BACKEND_CONTAINER,
      sClientCommand,
      60_000,
    );
    const sClientOutput = `${sClientResult.stdout}${sClientResult.stderr}`;
    await testInfo.attach("openssl-s_client-gitlab", {
      body: sClientOutput,
      contentType: "text/plain",
    });

    const parsed = parseOpenSslSClientOutput(sClientOutput);
    console.log(`[PQC] Protocol: ${parsed.protocol ?? "(missing)"}`);
    console.log(`[PQC] Negotiated group: ${parsed.negotiatedGroup ?? "(missing)"}`);
    console.log(`[PQC] Verify return code: ${parsed.verifyReturnCode ?? "(missing)"}`);

    expect(parsed.protocol, "TLS protocol should be TLSv1.3").toMatch(/^TLSv1\.3$/u);
    expect(
      isHybridMlKemGroup(parsed.negotiatedGroup),
      `Negotiated group must be hybrid ML-KEM, got: ${parsed.negotiatedGroup ?? "(missing)"}`,
    ).toBe(true);
    expect(parsed.verifyReturnCode, "Certificate verify return code should be 0").toBe(0);

    // Exercise Node fetch (same stack as GitLabIntegration.fetch); not PQ proof by itself.
    const token = process.env.AUTH_PROVIDERS_GITLAB_TOKEN;
    const fetchResult = await kube.execPodCommand(
      podName,
      namespace,
      BACKSTAGE_BACKEND_CONTAINER,
      buildGitlabFetchProbeCommand(host, token),
      30_000,
    );
    const fetchStatus = fetchResult.stdout.trim();
    console.log(`[PQC] Node fetch /api/v4/version status: ${fetchStatus}`);
    expect(
      fetchStatus,
      "Node fetch to GitLab should complete TLS and return an HTTP status",
    ).toMatch(/^\d{3}$/u);
  });
});

function requireEnv(name: string): string {
  const value = process.env[name];
  if (typeof value !== "string" || value === "") {
    throw new Error(`${name} environment variable is not set`);
  }
  return value;
}

async function findReadyHubPod(
  kube: KubeClient,
  namespace: string,
  deploymentName: string,
): Promise<string> {
  const pods = await kube.coreV1Api.listNamespacedPod(namespace);
  for (const pod of pods.body.items) {
    const name = pod.metadata?.name;
    if (name?.startsWith(`${deploymentName}-`) !== true) {
      continue;
    }
    if (pod.status?.phase !== "Running") {
      continue;
    }
    const ready =
      pod.status.containerStatuses?.some(
        (status) => status.name === BACKSTAGE_BACKEND_CONTAINER && status.ready,
      ) ?? false;
    if (ready) {
      return name;
    }
  }
  throw new Error(
    `No ready ${BACKSTAGE_BACKEND_CONTAINER} pod found for deployment ${deploymentName} in ${namespace}`,
  );
}
