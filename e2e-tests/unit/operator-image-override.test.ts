import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const script = fileURLToPath(
  new URL("../../.ci/pipelines/install-methods/operator.sh", import.meta.url),
);
const digest = `sha256:${"a".repeat(64)}`;

function override(tag: string, imageDigest = "") {
  return spawnSync(
    "/bin/bash",
    [
      "--noprofile",
      "--norc",
      "-eu",
      "-c",
      `
# Load the real CSV patcher without cluster setup or unrelated libraries.
source() { :; }
builtin source "$OPERATOR_SCRIPT"
log::info() { :; }; log::warn() { :; }; log::error() { printf '%s\\n' "$*" >&2; }
common::poll_until() { return 0; }
oc() {
  case "$1 $2" in
    'get clusterextension') return 1 ;;
    'get csv') printf 'clusterserviceversion.operators.coreos.com/rhdh-operator.v99\\n' ;;
    'get clusterserviceversion.'*) printf '%s' "$CSV_JSON" ;;
    'get deployment') return 0 ;;
    patch*)
      while [[ $# -gt 0 ]]; do
        if [[ "$1" == -p ]]; then printf '%s' "$2"; return 0; fi
        shift
      done
      return 1
      ;;
    *) return 1 ;;
  esac
}
override_operator_backstage_image test-operator
`,
    ],
    {
      encoding: "utf8",
      timeout: 10_000,
      env: {
        PATH: process.env.PATH,
        DIR: fileURLToPath(new URL("../../.ci/pipelines", import.meta.url)),
        OPERATOR_SCRIPT: script,
        IMAGE_REGISTRY: "quay.io",
        IMAGE_REPO: "test/rhdh",
        TAG_NAME: tag,
        IMAGE_DIGEST: imageDigest,
        CSV_JSON: JSON.stringify({
          spec: {
            install: {
              spec: {
                deployments: [
                  {
                    spec: {
                      template: {
                        spec: {
                          containers: [
                            { env: [{ name: "RELATED_IMAGE_backstage", value: "old-image" }] },
                          ],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        }),
      },
    },
  );
}

describe("operator CSV backstage image override", () => {
  it.each([
    ["next", "", "quay.io/test/rhdh:next"],
    ["next", digest, `quay.io/test/rhdh@${digest}`],
    [digest, "", `quay.io/test/rhdh@${digest}`],
  ])("patches the selected image for tag %s and digest %s", (tag, imageDigest, image) => {
    const result = override(tag, imageDigest);
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual([
      {
        op: "replace",
        path: "/spec/install/spec/deployments/0/spec/template/spec/containers/0/env/0/value",
        value: image,
      },
    ]);
  });

  it("rejects an invalid explicit digest before touching the CSV", () => {
    const result = override("next", "sha256:invalid");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("IMAGE_DIGEST must be a complete SHA-256 image digest");
    expect(result.stdout).toBe("");
  });
});
