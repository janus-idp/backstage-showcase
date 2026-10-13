// Jira: RHIDP-13242 — Attach the deployed app's source maps before monocart sees them
//
// Two reasons not to leave this to monocart's own resolver:
// - It fetches `*.js.map` with Node's certificate checks and logs a failure only at
//   debug level. CI clusters serve RHDH behind router certificates the test process
//   does not trust (the specs set ignoreHTTPSErrors for the same reason), so every
//   map would silently fail to load.
// - A bundle whose map did not load skips `sourceFilter` entirely and lands in the
//   report under its minified URL, which Codecov cannot match to the repository.
// Resolving here lets an entry without a map be dropped instead.

import http from "node:http";
import https from "node:https";

import { isAppBundle } from "./source-paths";

// Per map. Generous for a static file; bounds a stalled route instead of hanging onEnd.
const SOURCE_MAP_TIMEOUT_MS = 30_000;
const SOURCE_MAPPING_URL = /\/\/[#@] sourceMappingURL=(\S+)\s*$/u;

/** The fields of a V8 script coverage entry this module reads or sets. */
export type CoverageEntry = {
  url: string;
  source?: string;
  sourceMap?: unknown;
};

export function isCoverageEntry(value: unknown): value is CoverageEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "url" in value &&
    typeof value.url === "string"
  );
}

/** Fetch a JSON document over http(s), tolerating untrusted certificates. */
export function fetchJson(
  url: string,
  timeoutMs = SOURCE_MAP_TIMEOUT_MS,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https:") ? https : http;
    const request = client.get(
      url,
      { rejectUnauthorized: false, timeout: timeoutMs },
      (response) => {
        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`HTTP ${response.statusCode} for ${url}`));
          return;
        }
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk: string) => {
          body += chunk;
        });
        response.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        });
      },
    );
    request.on("timeout", () => {
      request.destroy(new Error(`Timed out after ${timeoutMs}ms: ${url}`));
    });
    request.on("error", reject);
  });
}

/** The absolute URL of the entry's external source map, if its source names one. */
export function sourceMapUrlOf(entry: CoverageEntry): string | undefined {
  const reference = SOURCE_MAPPING_URL.exec(entry.source ?? "")?.[1];
  if (reference === undefined || reference.startsWith("data:")) {
    return undefined;
  }
  try {
    return new URL(reference, entry.url).toString();
  } catch {
    return undefined;
  }
}

/**
 * Keeps the app's bundles and attaches each one's source map, fetched once per URL
 * across every raw coverage file. Entries whose map cannot be loaded are dropped.
 */
export class SourceMapLoader {
  private readonly maps = new Map<string, Promise<unknown>>();
  private readonly failed = new Set<string>();

  constructor(
    private readonly fetchMap: (url: string) => Promise<unknown> = fetchJson,
  ) {}

  /** Map URLs that could not be loaded so far. */
  get failures(): readonly string[] {
    return [...this.failed];
  }

  async attach(entries: unknown[]): Promise<CoverageEntry[]> {
    const appEntries = entries.filter(
      (entry): entry is CoverageEntry =>
        isCoverageEntry(entry) && isAppBundle(entry),
    );
    const mapped: CoverageEntry[] = [];
    for (const entry of appEntries) {
      const url = sourceMapUrlOf(entry);
      const sourceMap = url === undefined ? null : await this.load(url);
      if (sourceMap !== null) {
        mapped.push({ ...entry, sourceMap });
      }
    }
    return mapped;
  }

  private load(url: string): Promise<unknown> {
    let map = this.maps.get(url);
    if (map === undefined) {
      map = this.fetchMap(url).catch((error: unknown) => {
        this.failed.add(url);
        console.warn(`[coverage] Could not load source map ${url}:`, error);
        return null;
      });
      this.maps.set(url, map);
    }
    return map;
  }
}
