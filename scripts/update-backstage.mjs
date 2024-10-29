import glob from "glob";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import semver from "semver";

import { updateBuildMetadata } from "./update-metadata.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = join(__dirname, "..");
const DYNAMIC_PLUGINS_DIR = join(ROOT_DIR, "dynamic-plugins/wrappers");
const BACKSTAGE_JSON_PATH = join(ROOT_DIR, "backstage.json");
const BUILD_METADATA_PATH = join(
  ROOT_DIR,
  "packages/app/src/build-metadata.json",
);
const PACKAGE_JSON_GLOB = "**/package.json";
const IGNORE_GLOB = ["**/node_modules/**", "**/dist-dynamic/**"];
const BACKSTAGE_RELEASES_API =
  "https://api.github.com/repos/backstage/backstage/releases";

// Change directory to the root of the project
process.chdir(ROOT_DIR);

/**
 * Pins dependencies in package.json files by removing the caret (^) from version ranges.
 */
function pinDependencies() {
  const packageJsonFiles = glob.sync(PACKAGE_JSON_GLOB, {
    ignore: IGNORE_GLOB,
  });

  for (const packageJsonFile of packageJsonFiles) {
    try {
      const packageJsonPath = join(process.cwd(), packageJsonFile);
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
      // Replace all instances of "^" with "" in package.json dependencies
      for (const depType of [
        "dependencies",
        "devDependencies",
        "peerDependencies",
      ]) {
        if (packageJson[depType]) {
          for (const depName in packageJson[depType]) {
            packageJson[depType][depName] = packageJson[depType][
              depName
            ].replace(/^\^/, "");
          }
        }
      }
      writeFileSync(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2) + "\n",
        "utf8",
      );
    } catch (error) {
      console.error(`Error processing ${packageJsonFile}:`, error);
    }
  }
}

/**
 * Updates the version of a dynamic plugin in its package.json file.
 *
 * @param {string} pluginDir - The path to the dynamic plugin directory.
 */
function updateDynamicPluginVersion(pluginDir) {
  try {
    const packageJsonPath = join(pluginDir, "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    const { name, dependencies } = packageJson;

    for (const [depName, depVersion] of Object.entries(dependencies)) {
      const modifiedDepName = depName.replace(/^@/, "").replace(/\//g, "-");
      if (modifiedDepName === name) {
        console.log(`Updating ${name} to ${depVersion}...`);
        packageJson.version = depVersion;
      }
    }

    // Update hoisted dependency version if incorrect (simplified)
    const distDynamicPackageJsonPath = join(
      pluginDir,
      "dist-dynamic/package.json",
    );
    if (existsSync(distDynamicPackageJsonPath)) {
      const distDynamicPackageJson = JSON.parse(
        readFileSync(distDynamicPackageJsonPath, "utf8"),
      );
      packageJson.dependencies = Object.fromEntries(
        Object.entries(dependencies).map(([depName, depVersion]) => [
          depName,
          distDynamicPackageJson.peerDependencies[depName] || depVersion,
        ]),
      );
    }

    writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + "\n",
      "utf8",
    );
  } catch (error) {
    console.error(`Error updating plugin version in ${pluginDir}:`, error);
  }
}

/**
 * Updates the versions of all dynamic plugins in the dynamic-plugins directory.
 */
function updateDynamicPluginVersions() {
  try {
    process.chdir(DYNAMIC_PLUGINS_DIR);
    for (const dir of readdirSync(".", { withFileTypes: true })) {
      if (dir.isDirectory()) {
        updateDynamicPluginVersion(join(DYNAMIC_PLUGINS_DIR, dir.name));
      }
    }
  } catch (error) {
    console.error("Error updating dynamic plugin versions:", error);
  } finally {
    process.chdir(ROOT_DIR);
  }
}

/**
 * Fetches the latest Backstage version from the GitHub API.
 *
 * @returns {Promise<string>} The latest Backstage version.
 */
async function getLatestBackstageVersion() {
  try {
    const res = await fetch(BACKSTAGE_RELEASES_API);
    const data = await res.json();
    const versions = data
      .map((release) => release.tag_name)
      .filter(
        (version) => semver.valid(version) && !semver.prerelease(version),
      );
    return semver.maxSatisfying(versions, "*").substring(1);
  } catch (error) {
    console.error("Error fetching latest Backstage version:", error);
    throw error;
  }
}

/**
 * Updates the Backstage version in the backstage.json file.
 *
 * @param {string} version - The new Backstage version.
 */
function updateBackstageVersionFile(version) {
  try {
    const data = { version };
    writeFileSync(
      BACKSTAGE_JSON_PATH,
      JSON.stringify(data, null, 2) + "\n",
      "utf8",
    );
  } catch (error) {
    console.error("Error updating Backstage version file:", error);
  }
}

/**
 * Updates the `backstage.supported-versions` field in package.json files under the `DYNAMIC_PLUGINS_DIR`.
 *
 * @param {string} backstageVersion - The Backstage version to set.
 */
function updateSupportedBackstageVersions(backstageVersion) {
  const packageJsonFiles = glob.sync(PACKAGE_JSON_GLOB, {
    cwd: DYNAMIC_PLUGINS_DIR, // Search only within DYNAMIC_PLUGINS_DIR
    ignore: IGNORE_GLOB,
  });

  for (const packageJsonFile of packageJsonFiles) {
    try {
      const packageJsonPath = join(DYNAMIC_PLUGINS_DIR, packageJsonFile);
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

      // Update backstage.supported-versions
      packageJson["backstage"] = {
        ...packageJson["backstage"],
        "supported-versions": backstageVersion,
      };

      writeFileSync(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2) + "\n",
        "utf8",
      );
    } catch (error) {
      console.error(`Error processing ${packageJsonFile}:`, error);
    }
  }
}

/**
 * The main function that orchestrates the update process.
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const releaseIndex = args.indexOf("--release");
    const patternIndex = args.indexOf("--pattern");
    const skipExportDynamicIndex = args.indexOf("--skip-export-dynamic");
    const hasReleaseFlag = releaseIndex !== -1;
    const hasPatternFlag = patternIndex !== -1;
    const hasSkipExportDynamicFlag = skipExportDynamicIndex !== -1;

    // Ensure that --pattern and --release are not used together
    if (hasReleaseFlag && hasPatternFlag) {
      console.error(
        "Error: The --pattern and --release flags cannot be used together.",
      );
      process.exit(1);
    }

    // Construct the command for bumping versions
    let bumpCommand = "backstage-cli versions:bump --skip-install";
    let releaseVersion = "";
    let pattern = "";
    if (hasReleaseFlag) {
      releaseVersion = args[releaseIndex + 1];
      if (!releaseVersion) {
        console.error(
          `Error: The '--release' flag requires a version argument to bump to a specific Backstage release line or version (default: "main").`,
        );
        process.exit(1);
      }
      bumpCommand += ` --release ${releaseVersion}`;
    } else if (hasPatternFlag) {
      pattern = args[patternIndex + 1];
      if (!pattern) {
        console.error(
          "Error: The '--pattern' flag requires a glob pattern to specify which packages to upgrade.",
        );
        process.exit(1);
      }
      if (pattern.length > 0) {
        bumpCommand += ` --pattern ${pattern}`;
      }
    }

    console.log("Bumping version...");
    execSync(bumpCommand, { stdio: "inherit" });

    console.log("Pinning all dependencies...");
    pinDependencies();

    console.log("Updating wrapper versions...");
    updateDynamicPluginVersions();

    if (!hasReleaseFlag) {
      console.log("Fetching latest Backstage version...");
      releaseVersion = await getLatestBackstageVersion();
    }

    console.log(`Updating wrappers supported versions to ${releaseVersion}...`);
    updateSupportedBackstageVersions(releaseVersion);

    console.log("Updating lockfile...");
    execSync("yarn install --no-immutable", { stdio: "inherit" });

    console.log("Deduping lockfile...");
    execSync("yarn dedupe", { stdio: "inherit" });

    if (hasSkipExportDynamicFlag) {
      console.log(
        `Skipping 'Updating dynamic-plugins folder...' step because '--skip-export-dynamic' is provided.`,
      );
    } else {
      console.log("Updating dynamic-plugins folder...");
      execSync("yarn run export-dynamic:clean --affected", {
        stdio: "inherit",
      });
    }

    // Skip updating `backstage.json` if the Backstage version remains unchanged
    // Exclude the `@backstage-community` namespace in the regex
    // Ensure the regex comparison returns false to avoid unintended changes
    if (hasPatternFlag && /backstage[^-]/.test(pattern) === false) {
      return;
    }

    console.log(`Updating backstage.json to ${releaseVersion}...`);
    updateBackstageVersionFile(releaseVersion);

    console.log(`Updating ${BUILD_METADATA_PATH}...`);
    updateBuildMetadata(releaseVersion);

    console.log(
      `Successfully updated the Backstage Showcase to ${releaseVersion}!`,
    );
  } catch (error) {
    console.error("An error occurred during the update process:", error);
  }
}

main();
