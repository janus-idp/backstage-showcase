import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, expect, it, vi } from "vitest";

import { createRuntimeProgress } from "../playwright/utils/runtime-progress";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it("retains an unfinished phase before teardown/report publication without persisting secret fields", async () => {
  const directory = mkdtempSync(join(tmpdir(), "runtime-progress-"));
  vi.stubEnv("ARTIFACT_DIR", directory);
  vi.spyOn(console, "log").mockImplementation(() => {});
  const identity = {
    runId: "012345abcdef",
    namespace: "runtime",
    databasePrefix: "rt_012345abcdef_rds1_",
    provider: "rds" as const,
    slot: 1,
    installMethod: "operator" as const,
    password: "fake-password",
    apiToken: "fake-token",
  };
  const progress = createRuntimeProgress(
    {
      testId: "test/id",
      retry: 0,
      project: { name: "showcase-runtime" },
      outputPath: () => {
        throw new Error("Should write straight to CI artifacts");
      },
    },
    identity,
  );
  try {
    void progress.run("never-finishes", () => new Promise<void>(() => {}));
    const path = join(directory, "showcase-runtime", "runtime-progress", "test_id-0.jsonl");
    expect(readFileSync(path, "utf8")).toContain('"phase":"never-finishes","event":"started"');
    await expect(
      progress.run("drop-databases", () =>
        Promise.reject(Object.assign(new Error("fake-password fake-token"), { code: "55006" })),
      ),
    ).rejects.toThrow("fake-password");
    const text = readFileSync(path, "utf8");
    expect(text).toContain('"event":"failed"');
    expect(text).toContain('"errorCode":"55006"');
    expect(text).not.toMatch(/fake-password|fake-token|"password"|"apiToken"/u);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
