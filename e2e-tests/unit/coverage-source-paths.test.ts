import { describe, expect, it } from "vitest";

import { isAppBundle, isAppSource, toRepoPath } from "../playwright/support/coverage/source-paths";

// Shapes taken from a real run against quay.io/rhdh-community/rhdh:next: monocart
// unpacks `webpack://app/./src/App.tsx` into `app/src/App.tsx`.
describe("toRepoPath", () => {
  it("maps an app source onto its repository path", () => {
    expect(toRepoPath("app/src/App.tsx")).toBe("packages/app/src/App.tsx");
    expect(toRepoPath("app/src/modules/catalog/index.tsx")).toBe(
      "packages/app/src/modules/catalog/index.tsx",
    );
  });

  it("leaves anything else untouched", () => {
    expect(toRepoPath("app/node_modules/yaml/dist/index.js")).toBe(
      "app/node_modules/yaml/dist/index.js",
    );
    expect(toRepoPath("packages/app/src/App.tsx")).toBe("packages/app/src/App.tsx");
  });
});

describe("isAppSource", () => {
  it("keeps app sources in either form, since monocart rewrites before filtering", () => {
    expect(isAppSource("app/src/App.tsx")).toBe(true);
    expect(isAppSource("packages/app/src/App.tsx")).toBe(true);
  });

  it.each([
    "app/node_modules/@backstage/core-components/dist/index.esm.js",
    "app/webpack/runtime/load_script",
    "app/json/opt/app-root/src/packages/app/package.json",
    "localhost-7007/static/main.fced3a21418e.js",
  ])("drops %s", (sourcePath) => {
    expect(isAppSource(sourcePath)).toBe(false);
  });
});

describe("isAppBundle", () => {
  it("keeps bundles served from the app's /static/ path", () => {
    expect(isAppBundle({ url: "https://rhdh.example.com/static/main.fced3a21.js" })).toBe(true);
  });

  it.each([
    "https://rhdh.example.com/api/scalprum/plugin/remoteEntry.js",
    "https://rhdh.example.com/assets/static/main.js",
    "not a url",
  ])("drops %s", (url) => {
    expect(isAppBundle({ url })).toBe(false);
  });
});
