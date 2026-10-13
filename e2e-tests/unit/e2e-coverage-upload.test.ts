import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

// RHIDP-13242: testing::_upload_e2e_coverage must attribute the upload to the PR
// head commit, and only when the run tested that PR's own image. Presubmits test a
// local merge of the PR onto its base, so the checkout's HEAD is a commit GitHub has
// never seen.
const repository = fileURLToPath(new URL("../../", import.meta.url));
const PR_HEAD = "0123456789abcdef0123456789abcdef01234567";
// What the Prow step sets when it deploys the image built from this PR.
const PR_IMAGE_TAG = `pr-4321-${PR_HEAD.slice(0, 8)}`;
const PR_RUN = { PULL_PULL_SHA: PR_HEAD, PULL_NUMBER: "4321", TAG_NAME: PR_IMAGE_TAG };
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
    const { status, argv } = upload({ CODECOV_TOKEN: "token", ...PR_RUN });
    expect(status).toBe(0);
    expect(argv).not.toBeNull();
    expect(flag(argv!, "--sha")).toBe(PR_HEAD);
    expect(flag(argv!, "--pr")).toBe("4321");
    expect(flag(argv!, "--flag")).toBe("rhdh-e2e-frontend");
    expect(flag(argv!, "--file")).toBe(join(root, "lcov.info"));
  });

  it("hands the token to the CLI through the environment, never its arguments", () => {
    const { argv } = upload({ CODECOV_TOKEN: "s3cr3t-token", ...PR_RUN });
    expect(argv).not.toBeNull();
    expect(argv!.join(" ")).not.toContain("s3cr3t-token");
    expect(argv).not.toContain("--token");
    expect(readFileSync(join(root, "token"), "utf8")).toBe("s3cr3t-token");
  });

  it.each([
    ["a CI-only PR that deployed `next`", { ...PR_RUN, TAG_NAME: "next" }],
    ["a tag built from another commit", { ...PR_RUN, TAG_NAME: "pr-4321-ffffffff" }],
    // Rehearsals: PULL_* describe the openshift/release PR, the image is not an rhdh PR's.
    ["a rehearsal", { PULL_PULL_SHA: "a".repeat(40), PULL_NUMBER: "70001", TAG_NAME: "next" }],
    ["no PR at all (periodic)", { TAG_NAME: "next" }],
    ["a malformed sha", { ...PR_RUN, PULL_PULL_SHA: "HEAD" }],
    [
      "a non-numeric PR",
      { ...PR_RUN, PULL_NUMBER: "abc", TAG_NAME: `pr-abc-${PR_HEAD.slice(0, 8)}` },
    ],
  ])("skips the upload, without failing, for %s", (_, env) => {
    const { status, argv, stdout, stderr } = upload({ CODECOV_TOKEN: "token", ...env });
    expect(status).toBe(0);
    expect(argv).toBeNull();
    expect(stdout + stderr).toContain("did not test a PR image");
  });

  it("skips the upload when no token is mounted", () => {
    const { status, argv, stdout, stderr } = upload({ ...PR_RUN });
    expect(status).toBe(0);
    expect(argv).toBeNull();
    expect(stdout + stderr).toContain("CODECOV_TOKEN not set");
  });

  it("does not fail the job when the upload itself fails", () => {
    writeFileSync(join(root, "codecov"), "#!/bin/bash\nexit 1\n");
    const { status, stdout, stderr } = upload({ CODECOV_TOKEN: "token", ...PR_RUN });
    expect(status).toBe(0);
    expect(stdout + stderr).toContain("upload failed (non-fatal)");
  });
});
