#!/bin/bash

sed -i "/# BEGIN COPY package.json files/,/# END COPY package.json files/c# BEGIN COPY package.json files\n# END COPY package.json files" ./docker/Dockerfile
for path in $(find . -name package.json | grep -v node_modules/ ); 
  do sed -i "s|\# BEGIN COPY package.json files|\# BEGIN COPY package.json files\nCOPY $(echo $path | sed 's|\.\/|\$EXTERNAL_SOURCE_NESTED\/|g') $path|g" ./docker/Dockerfile; 
done
