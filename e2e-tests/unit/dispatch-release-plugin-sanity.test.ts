import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

const script = fileURLToPath(
  new URL("../local-harness/dispatch-release-plugin-sanity.sh", import.meta.url),
);
let root: string;

// Stub gh: branches, harness presence, dispatch and run conclusions come from
// the environment; every call is appended to $root/events.
const ghStub = `#!/bin/bash
echo "$*" >> "$STUB_ROOT/events"
has() { [[ " $1 " == *" $2 "* ]]; }
case "$1 $2" in
  "api --paginate") printf '%s\\n' $BRANCHES ;;
  "api -X")
    ref=$(printf '%s\\n' "$@" | sed -n 's/^ref=//p')
    has "$DISPATCH_FAIL" "$ref" && exit 1
    id=\${ref//[^0-9]/}
    echo "$id https://github.example/runs/$id" ;;
  "run watch") ;;
  "run view")
    var="CONCLUSION_$3"
    echo "\${!var:-success}" ;;
  api*)
    ref=\${2##*ref=}
    has "$HARNESS" "$ref" && exit 0
    [[ -n "$CONTENTS_ERROR" ]] && { echo "gh: Server Error (HTTP 502)" >&2; exit 1; }
    echo "gh: Not Found (HTTP 404)" >&2
    exit 1 ;;
esac
`;

function run(env: Record<string, string>) {
  const result = spawnSync("/bin/bash", [script], {
    env: {
      PATH: `${join(root, "bin")}:/usr/bin:/bin`,
      STUB_ROOT: root,
      GITHUB_REPOSITORY: "example/rhdh",
      GITHUB_STEP_SUMMARY: join(root, "summary"),
      BRANCHES: "main release-1.10 release-2.1 release-2.2 release-2.3",
      HARNESS: "release-2.1 release-2.2 release-2.3",
      ...env,
    },
    encoding: "utf8",
    timeout: 10_000,
  });
  const read = (name: string) => {
    try {
      return readFileSync(join(root, name), "utf8");
    } catch {
      return "";
    }
  };
  const dispatched = read("events")
    .split("\n")
    .filter((line) => line.includes("/dispatches"))
    .map((line) => / ref=(\S+)/u.exec(line)?.[1]);
  return { ...result, dispatched, summary: read("summary") };
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "rhdh-dispatch-sanity-"));
  mkdirSync(join(root, "bin"));
  writeFileSync(join(root, "bin", "gh"), ghStub, { mode: 0o700 });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("dispatch-release-plugin-sanity.sh", () => {
  it("dispatches the two newest release branches by default", () => {
    const result = run({});
    expect(result.status).toBe(0);
    expect(result.dispatched).toEqual(["release-2.3", "release-2.2"]);
  });

  it("stops at the first branch older than the harness", () => {
    const result = run({ RELEASE_COUNT: "5", HARNESS: "release-2.1 release-2.3" });
    expect(result.status).toBe(0);
    expect(result.dispatched).toEqual(["release-2.3"]);
  });

  it("exits 0 without dispatching when no release branch has the harness", () => {
    const result = run({ HARNESS: "" });
    expect(result.status).toBe(0);
    expect(result.dispatched).toEqual([]);
    expect(result.stdout).toContain("nothing to dispatch");
  });

  it("fails instead of reading an API error as a missing harness", () => {
    const result = run({ HARNESS: "", CONTENTS_ERROR: "1" });
    expect(result.status).toBe(1);
    expect(result.dispatched).toEqual([]);
    expect(result.stderr).toContain("HTTP 502");
  });

  it("fails when a run does not succeed and reports each conclusion", () => {
    const result = run({ CONCLUSION_22: "failure" });
    expect(result.status).toBe(1);
    expect(result.summary).toContain(
      "`release-2.3`: success ([run](https://github.example/runs/23))",
    );
    expect(result.summary).toContain(
      "`release-2.2`: failure ([run](https://github.example/runs/22))",
    );
  });

  it("still waits for the other runs when one dispatch fails", () => {
    const result = run({ DISPATCH_FAIL: "release-2.3" });
    expect(result.status).toBe(1);
    expect(result.summary).toContain("`release-2.3`: dispatch failed");
    expect(result.summary).toContain("`release-2.2`: success");
  });

  it.each(["0", "two"])("rejects RELEASE_COUNT=%s", (count) => {
    const result = run({ RELEASE_COUNT: count });
    expect(result.status).toBe(1);
    expect(result.dispatched).toEqual([]);
    expect(result.stderr).toContain("must be a positive integer");
  });
});
