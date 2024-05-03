/* eslint-disable */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Change directory to the root of the project
process.chdir(join(__dirname, '..'));

const backstageVersion = JSON.parse(
  readFileSync('backstage.json', 'utf8'),
).version.toString();

export function updateBuildMetadata(backstageVersion) {
  const buildMetadataPath = join(
    process.cwd(),
    'packages',
    'app',
    'src',
    'build-metadata.json',
  );
  const buildMetadata = JSON.parse(readFileSync(buildMetadataPath, 'utf8'));

  const rhdhVersion = JSON.parse(
    readFileSync('package.json', 'utf8'),
  ).version.toString();

  // const commitTime = new Date().toISOString() is similar but returns millis too: 2024-05-03T12:12:08.174Z
  // using the shell command allows us to have consistent datestamping everywhere, including sed+date transforms downstream
  // unsure if this will break anyone developing on Windows; could switch to ISOString if it's a problem.
  const commitTime = execSync('/usr/bin/date -u +%FT%TZ').toString().trim(); // eg., 2024-05-03T12:12:08Z

  const card = [
    `RHDH Version: ${rhdhVersion}`,
    `Backstage Version: ${backstageVersion}`,
    `Last Commit: ${commitTime}`,
  ];
  buildMetadata.card = card;

  writeFileSync(
    buildMetadataPath,
    JSON.stringify(buildMetadata, null, 2),
    'utf8',
  );
}

console.log('Updating packages/app/src/build-metadata.json ...');
updateBuildMetadata(backstageVersion);
