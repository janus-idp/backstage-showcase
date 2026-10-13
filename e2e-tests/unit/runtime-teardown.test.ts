import { expect, it } from "vitest";

import { teardownRuntime, type RuntimeTeardown } from "../playwright/utils/runtime-teardown";

function steps(overrides: Partial<RuntimeTeardown> = {}) {
  const calls: string[] = [];
  const step = (name: string) => () => {
    calls.push(name);
    return Promise.resolve();
  };
  const teardown: RuntimeTeardown = {
    label: "rds slot 1",
    setupError: undefined,
    redact: (text) => text.replaceAll("fake-password", "[REDACTED]"),
    progress: { run: (_phase, action) => action() },
    collectDiagnostics: step("diagnostics"),
    stopApplication: step("stop"),
    closeSqlClients: step("close-clients"),
    dropDatabases: step("drop"),
    reportCleanup: (completed) => {
      calls.push(`report:${completed}`);
      return Promise.resolve();
    },
    closeProxy: step("close-proxy"),
    deleteNamespace: step("delete-namespace"),
    ...overrides,
  };
  return { calls, teardown };
}
const failing = (message: string) => () => Promise.reject(new Error(message));

it("runs every phase in order and records each one", async () => {
  const phases: string[] = [];
  const { calls, teardown } = steps({
    progress: {
      run: (phase, action) => {
        phases.push(phase);
        return action();
      },
    },
  });
  await teardownRuntime(teardown);
  expect(calls).toEqual([
    "diagnostics",
    "stop",
    "close-clients",
    "drop",
    "report:true",
    "close-proxy",
    "delete-namespace",
  ]);
  expect(phases).toEqual([
    "diagnostics",
    "stop-application",
    "close-sql-clients",
    "drop-databases",
    "close-proxy",
    "delete-namespace",
  ]);
});

it("still drops databases and deletes the namespace when closing clients fails", async () => {
  const { calls, teardown } = steps({ closeSqlClients: failing("close failed") });
  await expect(teardownRuntime(teardown)).rejects.toThrow("rds slot 1 failed: Error: close failed");
  expect(calls).toEqual([
    "diagnostics",
    "stop",
    "drop",
    "report:true",
    "close-proxy",
    "delete-namespace",
  ]);
});

it("never drops databases under an application that did not stop", async () => {
  const { calls, teardown } = steps({ stopApplication: failing("stop failed") });
  await expect(teardownRuntime(teardown)).rejects.toThrow("stop failed");
  expect(calls).toEqual([
    "diagnostics",
    "close-clients",
    "report:false",
    "close-proxy",
    "delete-namespace",
  ]);
});

it("continues cleanup after a diagnostics failure and without optional steps", async () => {
  const { calls, teardown } = steps({
    collectDiagnostics: failing("diagnostics failed"),
    dropDatabases: undefined,
    closeProxy: undefined,
  });
  await expect(teardownRuntime(teardown)).rejects.toThrow("diagnostics failed");
  expect(calls).toEqual(["stop", "close-clients", "report:false", "delete-namespace"]);
});

it("rethrows a lone setup error unchanged and wraps a non-Error", async () => {
  const setupError = new Error("deploy failed");
  await expect(teardownRuntime(steps({ setupError }).teardown)).rejects.toBe(setupError);
  await expect(teardownRuntime(steps({ setupError: "boom" }).teardown)).rejects.toThrow(
    "rds slot 1 setup failed",
  );
});

it("reports the setup error first and redacts every message", async () => {
  const { teardown } = steps({
    setupError: new Error("deploy failed with fake-password"),
    deleteNamespace: failing("namespace stuck"),
  });
  const error: unknown = await teardownRuntime(teardown).catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(AggregateError);
  expect(String(error)).toContain(
    "rds slot 1 failed: Error: deploy failed with [REDACTED]; Error: namespace stuck",
  );
  expect(String(error)).not.toContain("fake-password");
});
