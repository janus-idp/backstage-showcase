/* eslint-disable */
import glob from 'glob';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';
import { updateBuildMetadata } from './update-metadata.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Change directory to the root of the project
process.chdir(join(__dirname, '..'));

function pinDependencies() {
  // Find all package.json files in the project while ignoring node_modules and dist-dynamic
  const packageJsonFiles = glob.sync('**/package.json', {
    ignore: ['**/node_modules/**', '**/dist-dynamic/**'],
  });

  for (const packageJsonFile of packageJsonFiles) {
    const packageJsonPath = join(process.cwd(), packageJsonFile);
    const packageJson = readFileSync(packageJsonPath, 'utf8');

    // Replace all instances of "^" with "" in package.json
    const modifiedContent = packageJson.replace(/"\^/g, '"');

    writeFileSync(packageJsonPath, modifiedContent, 'utf8');
  }
}

function updateDynamicPluginVersions() {
  // Change directory to the dynamic-plugins/wrappers folder
  process.chdir('./dynamic-plugins/wrappers');

  // Loop through all subdirectories and update the version in package.json
  for (const dir of readdirSync('.', { withFileTypes: true })) {
    if (!dir.isDirectory()) {
      continue;
    }

    process.chdir(dir.name);

    // Extract the value of the "name" key from package.json
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const name = packageJson.name;

    // Extract the list from the "dependencies" object
    const deps = Object.entries(packageJson.dependencies);

    // Loop over each key in the "dependencies" object
    for (const [depName, depVersion] of deps) {
      // Replace "@" with "" and "/" with "-"
      const modifiedDepName = depName.replace(/^@/, '').replace(/\//g, '-');

      // Check if the modified dependency name matches the "name" value
      if (modifiedDepName === name) {
        console.log(`Updating ${name} to ${depVersion}...`);

        // Update the value of the "version" key in package.json
        packageJson.version = depVersion;
      }

      // Update hoisted dependency version if incorrect
      if (existsSync('./dist-dynamic/package.json')) {
        const distDynamicPackageJson = JSON.parse(
          readFileSync('./dist-dynamic/package.json', 'utf8'),
        );

        const distDynamicDeps = Object.entries(
          distDynamicPackageJson.peerDependencies,
        );

        const newDeps = deps.reduce((prev, [depName, depVersion]) => {
          const distDynamicDep = distDynamicDeps.find(
            ([distDynamicDepName]) => distDynamicDepName === depName,
          );

          if (distDynamicDep) {
            const [, distDynamicDepVersion] = distDynamicDep;

            prev[depName] = distDynamicDepVersion;
          } else {
            prev[depName] = depVersion;
          }

          return prev;
        }, {});

        packageJson.dependencies = newDeps;
      }
    }

    const modifiedContent = `${JSON.stringify(packageJson, null, 2)}\n`;

    writeFileSync('package.json', modifiedContent, 'utf8');

    process.chdir('..');
  }

  // Change directory to the root of the project
  process.chdir('../..');
}

async function getLatestBackstageVersion() {
  const res = await fetch(
    'https://api.github.com/repos/backstage/backstage/releases',
  );
  const data = await res.json();
  const versions = data.map(release => release.tag_name);
  const filteredVersions = versions.filter(
    version => semver.valid(version) && !semver.prerelease(version),
  );
  return semver.maxSatisfying(filteredVersions, '*').substring(1);
}

function updateBackstageVersionFile(version) {
  const modifiedContent = `${JSON.stringify({ version }, null, 2)}\n`;

  writeFileSync('backstage.json', modifiedContent, 'utf8');
}

console.log('Bumping version...');
execSync('yarn run versions:bump', { stdio: 'inherit' });

console.log('Pinning all dependencies...');
pinDependencies();

console.log('Updating dynamic plugin versions...');
updateDynamicPluginVersions();

console.log('Updating lockfile...');
execSync('yarn install', { stdio: 'inherit' });

console.log('Updating dynamic-plugins folder...');
execSync('yarn run export-dynamic --no-cache -- -- --clean', {
  stdio: 'inherit',
});

console.log('Fetching latest Backstage version...');
const backstageVersion = await getLatestBackstageVersion();

console.log(`Updating backstage.json to ${backstageVersion}...`);
updateBackstageVersionFile(backstageVersion);

console.log('Updating packages/app/src/build-metadata.json ...');
updateBuildMetadata(backstageVersion);

console.log(
  `Successfully updated the Backstage Showcase to ${backstageVersion}!`,
);
