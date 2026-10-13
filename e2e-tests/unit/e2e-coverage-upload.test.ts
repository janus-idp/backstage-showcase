import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

// RHIDP-13242: testing::_upload_e2e_coverage must attribute the upload to the PR
// head commit. Presubmits test a local merge of the PR onto its base, so the
// checkout's HEAD is a commit GitHub has never seen.
const repository = fileURLToPath(new URL("../../", import.meta.url));
const PR_HEAD = "0123456789abcdef0123456789abcdef01234567";
let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "rhdh-e2e-coverage-upload-"));
  // Records its argv and the token it can see instead of talking to Codecov.
  writeFileSync(
    join(root, "codecov"),
    `#!/bin/bash\nprintf '%s\\n' "$@" > "${root}/argv"\nprintf '%s' "\${CODECOV_TOKEN:-}" > "${root}/token"\n`,
  );
  chmodSync(join(root, "codecov"), 0o755);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function upload(env: Record<string, string>) {
  const result = spawnSync(
    "/bin/bash",
    [
      "--noprofile",
      "--norc",
      "-euc",
      'source "$DIR/lib/testing.sh"; testing::_upload_e2e_coverage "$ROOT/lcov.info"',
    ],
    {
      env: {
        PATH: process.env.PATH,
        HOME: root,
        ROOT: root,
        DIR: join(repository, ".ci/pipelines"),
        ARTIFACT_DIR: root,
        SHARED_DIR: root,
        CODECOV_BIN: join(root, "codecov"),
        ...env,
      },
      encoding: "utf8",
      timeout: 10_000,
    },
  );
  const argvFile = join(root, "argv");
  const argv = existsSync(argvFile) ? readFileSync(argvFile, "utf8").trim().split("\n") : null;
  return { ...result, argv };
}

function flag(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
}

describe("testing::_upload_e2e_coverage", () => {
  it("uploads to the PR head commit Prow reports, not the merge commit", () => {
    const { status, argv } = upload({
      CODECOV_TOKEN: "token",
      PULL_PULL_SHA: PR_HEAD,
      PULL_NUMBER: "4321",
    });
    expect(status).toBe(0);
    expect(argv).not.toBeNull();
    expect(flag(argv!, "--sha")).toBe(PR_HEAD);
    expect(flag(argv!, "--pr")).toBe("4321");
    expect(flag(argv!, "--flag")).toBe("rhdh-e2e-frontend");
    expect(flag(argv!, "--file")).toBe(join(root, "lcov.info"));
  });

  it("hands the token to the CLI through the environment, never its arguments", () => {
    const { argv } = upload({
      CODECOV_TOKEN: "s3cr3t-token",
      PULL_PULL_SHA: PR_HEAD,
      PULL_NUMBER: "1",
    });
    expect(argv).not.toBeNull();
    expect(argv!.join(" ")).not.toContain("s3cr3t-token");
    expect(argv).not.toContain("--token");
    expect(readFileSync(join(root, "token"), "utf8")).toBe("s3cr3t-token");
  });

  it("falls back to JOB_SPEC and GIT_PR_NUMBER for a Gangway re-run", () => {
    const { argv } = upload({
      CODECOV_TOKEN: "token",
      JOB_SPEC: JSON.stringify({ refs: { pulls: [{ sha: PR_HEAD }] } }),
      GIT_PR_NUMBER: "77",
    });
    expect(flag(argv!, "--sha")).toBe(PR_HEAD);
    expect(flag(argv!, "--pr")).toBe("77");
  });

  it.each([
    ["no PR head at all", {}],
    ["a malformed sha", { PULL_PULL_SHA: "HEAD", PULL_NUMBER: "1" }],
    ["a non-numeric PR", { PULL_PULL_SHA: PR_HEAD, PULL_NUMBER: "abc" }],
  ])("skips the upload, without failing, on %s", (_, env) => {
    const { status, argv, stdout, stderr } = upload({ CODECOV_TOKEN: "token", ...env });
    expect(status).toBe(0);
    expect(argv).toBeNull();
    expect(stdout + stderr).toContain("No PR head commit");
  });

  it("skips the upload when no token is mounted", () => {
    const { status, argv, stdout, stderr } = upload({
      PULL_PULL_SHA: PR_HEAD,
      PULL_NUMBER: "1",
    });
    expect(status).toBe(0);
    expect(argv).toBeNull();
    expect(stdout + stderr).toContain("CODECOV_TOKEN not set");
  });
});
