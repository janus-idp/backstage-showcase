import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

const pipelines = fileURLToPath(new URL("../../.ci/pipelines", import.meta.url));
let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "rhdh-disconnected-registry-"));
  for (const directory of ["shared", "private"]) mkdirSync(join(root, directory));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function setup() {
  // Source the real library; replace only cluster access and unrelated helpers.
  return spawnSync(
    "/bin/bash",
    [
      "--noprofile",
      "--norc",
      "-ec",
      `
source "$PIPELINES/lib/log.sh"
source "$PIPELINES/lib/disconnected/local/registry.sh"
disconnected::wait_local_integrated_registry() { :; }
disconnected::ensure_local_amd64_skopeo_shim() { :; }
disconnected::ensure_local_mirror_projects() { :; }
oc() {
  case "$*" in
    *'-o jsonpath={.spec.host}') printf 'registry.test' ;;
    *'configmap default-ingress-cert'*) printf 'synthetic-ca' ;;
    *'secret pull-secret'*) printf '%s' '{"auths":{"base.test":{"auth":"YmFzZQ=="}}}' | base64 ;;
    'whoami -t') printf 'synthetic-token' ;;
    'whoami') printf 'tester' ;;
  esac
}
disconnected::setup_local_ocp_mirror > /dev/null 2>&1
printf '%s' "$MIRROR_REGISTRY_PULL_SECRET"
`,
    ],
    {
      env: {
        PATH: process.env.PATH,
        HOME: root,
        PIPELINES: pipelines,
        SHARED_DIR: join(root, "shared"),
        DISCONNECTED_TMPDIR: join(root, "private"),
      },
      encoding: "utf8",
      timeout: 10_000,
    },
  );
}

describe("local disconnected mirror credentials", () => {
  it("writes the merged pull secret outside SHARED_DIR", () => {
    const result = setup();
    expect(result.status).toBe(0);
    expect(result.stdout).toBe(join(root, "private/pull-secret.json"));
    const shared = readdirSync(join(root, "shared"), { recursive: true, encoding: "utf8" });
    expect(new Set(shared)).toEqual(new Set(["disconnected-mirror", "disconnected-mirror/ca.crt"]));
    const secret: unknown = JSON.parse(readFileSync(result.stdout, "utf8"));
    for (const registry of [
      "base.test",
      "registry.test",
      "image-registry.openshift-image-registry.svc:5000",
    ]) {
      expect(secret).toHaveProperty(["auths", registry]);
    }
  });

  it("fails without a private directory instead of falling back to SHARED_DIR", () => {
    rmSync(join(root, "private"), { recursive: true });
    const result = setup();
    expect(result.status).not.toBe(0);
    expect(readdirSync(join(root, "shared"), { recursive: true })).toEqual([]);
  });
});
