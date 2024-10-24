const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

const styleInjectSourcePath = path.resolve(
  __dirname,
  '../../../../node_modules/style-inject/dist',
);
const styleInjectTargetPath = path.resolve(
  __dirname,
  '../../../../node_modules/@backstage-community/plugin-topology/dist/node_modules/style-inject/dist',
);

fse.ensureDirSync(styleInjectTargetPath);

fse.copySync(styleInjectSourcePath, styleInjectTargetPath);
console.log("Copied style-inject to plugin's dist/node_modules");

const esFilePath = path.join(styleInjectTargetPath, 'style-inject.es.js');
const esmFilePath = path.join(styleInjectTargetPath, 'style-inject.es.esm.js');

if (fs.existsSync(esFilePath)) {
  fs.renameSync(esFilePath, esmFilePath);
  console.log('Renamed style-inject.es.js to style-inject.es.esm.js');
} else {
  console.log('style-inject.es.js not found.');
}
