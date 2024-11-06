#!/bin/bash
for dockerfile in ./docker/Dockerfile .rhdh/docker/Dockerfile; do
  sed -i "/# BEGIN COPY package.json files/,/# END COPY package.json files/c# BEGIN COPY package.json files\n# END COPY package.json files" $dockerfile
  for path in $(find . -name package.json | grep -v node_modules/ ); do
    sed -i "s|\# BEGIN COPY package.json files|\# BEGIN COPY package.json files\nCOPY ${path/\./\$EXTERNAL_SOURCE_NESTED} $path|g" $dockerfile
  done
done