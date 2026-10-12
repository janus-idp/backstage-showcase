import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const pipelinesDir = resolve(import.meta.dirname, "../../.ci/pipelines");
const dirs: string[] = [];
const cancellationError = "Error: The `onCancel` handler was attached after the promise settled.";

type InstallResult = { status: number; output: string };

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function runInstall(
  results: InstallResult[],
  commands = 'testing::install_dependencies "showcase"',
) {
  const dir = mkdtempSync(join(tmpdir(), "rhdh-ci-install-"));
  dirs.push(dir);
  const cases = results
    .map(
      ({ status, output }, index) =>
        `${index + 1}) printf '%s\\n' ${shellQuote(output)}; return ${status} ;;`,
    )
    .join("\n");
  const script = `
    export DIR=${shellQuote(pipelinesDir)}
    export ARTIFACT_DIR=${shellQuote(join(dir, "artifacts"))}
    export SHARED_DIR=${shellQuote(join(dir, "shared"))}
    mkdir -p "$SHARED_DIR"
    declare -A STATUS_DEPLOYMENT_NAMESPACE STATUS_FAILED_TO_DEPLOY STATUS_TEST_FAILED STATUS_NUMBER_OF_TEST_FAILED
    source "$DIR/lib/testing.sh"
    calls=0
    yarn() {
      printf '%s retry=%s\\n' "$*" "\${YARN_HTTP_RETRY-unset}" >> ${shellQuote(join(dir, "calls"))}
      if [[ "$1" != install ]]; then
        return 99
      fi
      calls=$((calls + 1))
      case "$calls" in
        ${cases}
        *) return 0 ;;
      esac
    }
    sleep() {
      printf '%s\\n' "$*" >> ${shellQuote(join(dir, "sleeps"))}
    }
    ${commands}
  `;
  const result = spawnSync("bash", ["-eu", "-c", script], {
    cwd: dir,
    encoding: "utf8",
    timeout: 10_000,
  });
  if (result.error !== undefined) {
    throw result.error;
  }
  return {
    dir,
    status: result.status,
    output: result.stdout + result.stderr,
    calls: readFileSync(join(dir, "calls"), "utf8").trim().split("\n"),
  };
}

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("CI dependency installation", () => {
  it("installs immutably, scopes HTTP retries, and reuses success across projects", () => {
    const result = runInstall(
      [{ status: 0, output: "install succeeded" }],
      `
        export YARN_HTTP_RETRY=7
        testing::install_dependencies "showcase"
        testing::install_dependencies "showcase-rbac"
        [[ "$YARN_HTTP_RETRY" == 7 ]]
      `,
    );

    expect(result.status, result.output).toBe(0);
    expect(result.calls).toEqual(["install --immutable retry=0"]);
    expect(
      readFileSync(join(result.dir, "artifacts/showcase/setup/yarn-install-attempt-1.log"), "utf8"),
    ).toBe("install succeeded\n");
  });

  it("does not reuse an install from a different workspace", () => {
    const result = runInstall(
      [{ status: 0, output: "install succeeded" }],
      `
        testing::install_dependencies "showcase"
        mkdir other-workspace
        cd other-workspace
        testing::install_dependencies "other"
      `,
    );

    expect(result.status, result.output).toBe(0);
    expect(result.calls).toHaveLength(2);
  });

  it.each([
    cancellationError,
    "➤ YN0001: │ RequestError: read ECONNRESET",
    "➤ YN0001: │ RequestError: Timeout awaiting 'socket' for 60000ms (ETIMEDOUT)",
    "Error: getaddrinfo EAI_AGAIN registry.npmjs.org",
    "RequestError: socket hang up",
    "➤ YN0035: │ Response Code: 503 (Service Unavailable)",
    "RequestError: Response code 429 (Too Many Requests)",
  ])("recovers from a transient failure and preserves both attempt logs: %s", (output) => {
    const result = runInstall([
      { status: 1, output },
      { status: 0, output: "install succeeded" },
    ]);

    expect(result.status, result.output).toBe(0);
    expect(result.calls).toEqual(["install --immutable retry=0", "install --immutable retry=0"]);
    const logsDir = join(result.dir, "artifacts/showcase/setup");
    expect(readdirSync(logsDir).toSorted()).toEqual([
      "yarn-install-attempt-1.log",
      "yarn-install-attempt-2.log",
    ]);
    expect(readFileSync(join(logsDir, "yarn-install-attempt-1.log"), "utf8")).toBe(`${output}\n`);
    expect(readFileSync(join(result.dir, "sleeps"), "utf8")).toBe("5\n");
  });

  it.each([
    "➤ YN0028: │ The lockfile would have been modified by this install",
    "➤ YN0018: │ The remote archive doesn't match the expected checksum",
    "➤ YN0056: │ Cache entry required but missing",
    "Usage Error: Unrecognized or legacy configuration settings found",
    "➤ YN0035: │ Response Code: 401 (Unauthorized)",
    "➤ YN0035: │ Response Code: 404 (Not Found)",
    "Error: Cannot find module './missing-module'",
    'var bundledSource = "ETIMEDOUT ECONNRESET socket hang up";\nTypeError: broken linker',
    `➤ YN0028: │ The lockfile would have been modified\n${cancellationError}`,
  ])("does not retry a permanent or unrelated failure: %s", (output) => {
    const result = runInstall([{ status: 17, output }]);

    expect(result.status, result.output).toBe(17);
    expect(result.calls).toHaveLength(1);
    expect(readdirSync(join(result.dir, "artifacts/showcase/setup"))).toEqual([
      "yarn-install-attempt-1.log",
    ]);
  });

  it("stops after three failed attempts, preserving the last exit code and every log", () => {
    const result = runInstall([
      { status: 1, output: cancellationError },
      { status: 2, output: cancellationError },
      { status: 23, output: cancellationError },
    ]);

    expect(result.status, result.output).toBe(23);
    expect(result.calls).toHaveLength(3);
    expect(readdirSync(join(result.dir, "artifacts/showcase/setup"))).toHaveLength(3);
    expect(readFileSync(join(result.dir, "sleeps"), "utf8")).toBe("5\n10\n");
  });

  it("does not cache a failed installation", () => {
    const result = runInstall(
      [{ status: 1, output: "Usage Error: invalid configuration" }],
      `
        if testing::install_dependencies "showcase"; then exit 99; fi
        testing::install_dependencies "showcase-rbac"
      `,
    );

    expect(result.status, result.output).toBe(0);
    expect(result.calls).toHaveLength(2);
  });

  it("keeps the CI run failed and never starts Playwright when setup fails", () => {
    const result = runInstall(
      [{ status: 17, output: "➤ YN0028: │ The lockfile would have been modified" }],
      'testing::run_tests "rhdh" "showcase" "showcase"',
    );

    expect(result.status, result.output).toBe(17);
    expect(result.calls).toEqual(["install --immutable retry=0"]);
    expect(readFileSync(join(result.dir, "shared/STATUS_TEST_FAILED.txt"), "utf8")).toBe("true\n");
    expect(readFileSync(join(result.dir, "shared/STATUS_NUMBER_OF_TEST_FAILED.txt"), "utf8")).toBe(
      "N/A\n",
    );
    expect(result.output).toContain("=== YARN INSTALL FAILED ===");
    expect(readdirSync(join(result.dir, "artifacts/showcase/setup"))).toHaveLength(1);
  });
});
