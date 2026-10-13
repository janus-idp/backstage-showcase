import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SourceMapLoader } from "../playwright/support/coverage/source-maps";

const MAP = { version: 3, sources: ["webpack://app/./src/App.tsx"], mappings: "AAAA" };
let rawDir: string;

beforeEach(() => {
  rawDir = mkdtempSync(join(tmpdir(), "rhdh-coverage-raw-"));
  // paths.ts reads the directory once, at import.
  vi.stubEnv("COVERAGE_OUTPUT_DIR", rawDir);
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  rmSync(rawDir, { recursive: true, force: true });
});

function bundle(url: string) {
  return { url, source: "console.log(1);\n//# sourceMappingURL=main.js.map", functions: [] };
}

async function merge(files: Record<string, unknown>, fetchMap: () => Promise<unknown>) {
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(
      join(rawDir, name),
      typeof content === "string" ? content : JSON.stringify(content),
    );
  }
  const { mergeRawCoverage } = await import("../playwright/support/coverage/reporter");
  const add = vi.fn<(entries: unknown[]) => Promise<unknown>>(() => Promise.resolve(null));
  await mergeRawCoverage({ add }, Object.keys(files), new SourceMapLoader(fetchMap));
  return add;
}

describe("mergeRawCoverage", () => {
  it("adds each file's app bundles, with their source maps attached", async () => {
    const add = await merge(
      {
        "a.json": [bundle("https://rhdh.test/static/main.js")],
        "b.json": [bundle("https://rhdh.test/api/scalprum/plugin/remoteEntry.js")],
      },
      () => Promise.resolve(MAP),
    );
    expect(add.mock.calls).toEqual([
      [[{ ...bundle("https://rhdh.test/static/main.js"), sourceMap: MAP }]],
      [[]],
    ]);
  });

  it("skips a file that is not a V8 coverage array and keeps going", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const add = await merge(
      {
        "bad.json": { not: "an array" },
        "good.json": [bundle("https://rhdh.test/static/main.js")],
      },
      () => Promise.resolve(MAP),
    );
    expect(add).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Skipping bad.json"));
  });

  it("leaves out bundles whose map failed to load, and says how many", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const add = await merge({ "a.json": [bundle("https://rhdh.test/static/main.js")] }, () =>
      Promise.reject(new Error("certificate rejected")),
    );
    expect(add.mock.calls).toEqual([[[]]]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("1 source map(s) could not be loaded"),
    );
  });
});
