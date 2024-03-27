const exec = require('child_process').execSync;
const tar = require('tar');
const fs = require('fs');
const path = require('path');
const process = require('process');
const packageJson = require('./package.json');

const devMode = process.argv.includes('--dev', 2);
const dynamicPluginsRoot = path.join(
  __dirname,
  '..',
  '..',
  'dynamic-plugins-root',
);
if (devMode && !fs.existsSync(dynamicPluginsRoot)) {
  console.warn(
    `Directory '${dynamicPluginsRoot}' doesn't exist. Cannot symlink.`,
  );
  process.exit(1);
}

const cleanMode = process.argv.includes('--clean', 2);
const noInstall = process.argv.includes('--no-install', 2);
const installOnly = process.argv.includes('--install-only', 2);

for (const dep in packageJson.peerDependencies) {
  if (!Object.hasOwn(packageJson.peerDependencies, dep)) {
    continue;
  }

  console.log(`Importing: ${dep}@${packageJson.peerDependencies[dep]}`);
  const directory = dep.replace(/^@/, '').replace(/\//, '-');

  if (!installOnly) {
    // BEGIN-NOSCAN
    // This is a dev tool. We don't care about security here.
    const archive = exec(
      `npm pack ${dep}@${packageJson.peerDependencies[dep]}`,
      {
        stdio: ['pipe', 'pipe', 'ignore'],
      },
    )
      .toString()
      .trim();
    // END-NOSCAN

    if (cleanMode) {
      console.log(
        `Deleting previous package directory for: ${dep}@${packageJson.peerDependencies[dep]}`,
      );
      fs.rmSync(directory, { recursive: true, force: true });
    }
    fs.mkdirSync(directory, { recursive: true });

    console.log(
      `Extracting: ${dep}@${packageJson.peerDependencies[dep]} to ${directory}`,
    );

    // BEGIN-NOSCAN
    // This is a dev tool. We don't care about security here.
    // In addition, the tar package filter insecure entries by default
    // (see default value for 'preservePaths').
    tar.x({
      file: archive,
      cwd: directory,
      strip: 1,
      sync: true,
    });
    // END-NOSCAN

    fs.rmSync(archive);
  } else {
    if (cleanMode) {
      console.log(
        `Deleting previous package directory for: ${dep}@${packageJson.peerDependencies[dep]}`,
      );
      fs.rmSync(directory, { recursive: true, force: true });
    }
    fs.mkdirSync(directory, { recursive: true });

    console.log(
      `Skipping extraction of : ${dep}@${packageJson.peerDependencies[dep]} since --install-only was passed`,
    );
  }

  const pkgJson = require(
    fs.realpathSync(path.join(directory, 'package.json')),
  );
  if (!pkgJson?.backstage?.role) {
    console.error(
      `Package '${directory}' is missing 'backstage.role' attribute.`,
    );
    continue;
  }

  if (pkgJson.backstage.role === 'frontend-plugin') {
    if (!fs.existsSync(path.join(directory, 'dist-scalprum'))) {
      console.error(
        `Frontend plugin package '${directory}' is missing 'dist-scalprum' sub-folder.`,
      );
    }
  } else {
    const distDynamicDir = path.join(directory, 'dist-dynamic');
    if (!fs.existsSync(distDynamicDir)) {
      console.error(
        `Backend plugin package '${directory}' is missing 'dist-dynamic' sub-folder.`,
      );
      continue;
    }

    if (!noInstall) {
      console.log(
        `Installing dependencies for: ${pkgJson.name}-dynamic@${pkgJson.version}`,
      );

      // BEGIN-NOSCAN
      // This is a dev tool. We assume the right yarn is on the PATH.
      exec('yarn workspaces focus --production', {
        cwd: distDynamicDir,
      });
      // END-NOSCAN
    }
  }

  if (devMode) {
    const distDynamicDir = path.join(directory, 'dist-dynamic');
    const dedicatedDynamicPackage = fs.existsSync(distDynamicDir);

    const packageToLink = dedicatedDynamicPackage ? distDynamicDir : directory;
    const linkName = dedicatedDynamicPackage
      ? `${directory}-dynamic`
      : directory;
    const linkPath = path.join(dynamicPluginsRoot, linkName);

    console.log(`Symlinking ${linkPath} to ${packageToLink}`);
    fs.rmSync(linkPath, { force: true });
    fs.symlinkSync(fs.realpathSync(packageToLink), linkPath, 'dir');
  }
}
