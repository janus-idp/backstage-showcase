const fs = require('fs');
const path = require('path');
const process = require('process');

process.chdir(path.join(__dirname, '..'));

if (!process.argv[2]) {
  console.log('Usage: node copy-plugins.js <destination directory>');
  process.exit(1);
}

const destination = process.argv[2];
fs.mkdirSync(destination, { recursive: true });

const wrappersDir = path.join('.', 'wrappers');
const importsDir = path.join('.', 'imports');

const wrappers = fs
  .readdirSync(wrappersDir, {
    withFileTypes: true,
  })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => path.join(wrappersDir, dirent.name));

const imports = fs
  .readdirSync(importsDir, {
    withFileTypes: true,
  })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => path.join(importsDir, dirent.name));

for (const directory of [...imports, ...wrappers]) {
  const distDynamicDir = path.join(directory, 'dist-dynamic');

  const packageToCopy = fs.existsSync(distDynamicDir)
    ? distDynamicDir
    : directory;

  const pkgJsonPath = path.join(packageToCopy, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    console.error(`No 'package.json' in '${directory}': skipping`);
    continue;
  }
  const pkgJson = require(fs.realpathSync(pkgJsonPath));
  if (!pkgJson || !pkgJson.name) {
    console.error(
      `Package '${directory}' is missing 'package.json' or 'name' attribute.`,
    );
    continue;
  }
  const copyName = pkgJson.name.replace(/^@/, '').replace(/\//, '-');

  console.log(`Copying ${packageToCopy} to ${destination}`);
  const destinationDir = path.join(destination, copyName);
  fs.rmSync(destinationDir, { recursive: true, force: true });
  fs.cpSync(fs.realpathSync(packageToCopy), destinationDir, {
    recursive: true,
  });
}
