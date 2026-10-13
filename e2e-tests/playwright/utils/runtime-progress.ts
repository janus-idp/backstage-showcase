import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

import type { TestInfo } from "@playwright/test";

interface RuntimeIdentity {
  runId: string;
  namespace: string;
  databasePrefix: string;
  provider: "azure" | "rds" | "cloudsql";
  slot: number;
  installMethod: "helm" | "operator";
}
type ProgressInfo = Pick<TestInfo, "testId" | "retry" | "outputPath"> & {
  project: { name: string };
};
const safe = (value: string) => value.replaceAll(/[^a-zA-Z0-9_-]/gu, "_");

/** Persist non-secret phase evidence directly in CI artifacts, before reporter/teardown completion. */
export function createRuntimeProgress(info: ProgressInfo, identity: RuntimeIdentity) {
  const directory = process.env.ARTIFACT_DIR;
  const path =
    directory === undefined || directory === ""
      ? info.outputPath("runtime-progress.jsonl")
      : join(
          directory,
          safe(info.project.name),
          "runtime-progress",
          `${safe(info.testId)}-${info.retry}.jsonl`,
        );
  // Progress is evidence, never control flow: a full disk must not skip a cleanup phase.
  let fileAvailable = true;
  const persist = (write: () => void) => {
    if (!fileAvailable) return;
    try {
      write();
    } catch (error) {
      fileAvailable = false;
      const code: unknown =
        typeof error === "object" && error !== null ? Reflect.get(error, "code") : undefined;
      console.warn(
        `[runtime] Progress file unavailable (${typeof code === "string" ? code : "unknown"}); continuing with console records only`,
      );
    }
  };
  // Default modes: the content is whitelisted and the artifact uploader may run as another user.
  persist(() => {
    mkdirSync(dirname(path), { recursive: true });
  });

  const record = (
    phase: string,
    event: "started" | "completed" | "failed",
    durationMs?: number,
    error?: unknown,
  ) => {
    // Explicit whitelist: never serialize configs, request headers, error messages, or Secrets.
    const code: unknown =
      typeof error === "object" && error !== null ? Reflect.get(error, "code") : undefined;
    const item = {
      timestamp: new Date().toISOString(),
      runId: identity.runId,
      namespace: identity.namespace,
      databasePrefix: identity.databasePrefix,
      provider: identity.provider,
      slot: identity.slot,
      installMethod: identity.installMethod,
      retry: info.retry,
      phase,
      event,
      durationMs,
      errorName: error instanceof Error ? error.name : undefined,
      errorCode: typeof code === "string" || typeof code === "number" ? code : undefined,
    };
    const line = JSON.stringify(item);
    console.log(`[runtime] ${line}`);
    persist(() => {
      appendFileSync(path, `${line}\n`);
    });
  };
  return {
    /** For phases that end outside one callback, such as the test body between fixture `use` calls. */
    begin(phase: string): (passed: boolean) => void {
      const start = Date.now();
      record(phase, "started");
      return (passed) => {
        record(phase, passed ? "completed" : "failed", Date.now() - start);
      };
    },
    async run<T>(phase: string, action: () => Promise<T>): Promise<T> {
      const start = Date.now();
      record(phase, "started");
      try {
        const result = await action();
        record(phase, "completed", Date.now() - start);
        return result;
      } catch (error) {
        record(phase, "failed", Date.now() - start, error);
        throw error;
      }
    },
  };
}
