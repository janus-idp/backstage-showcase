#!/bin/bash
#
# Copyright (c) 2024-2025 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Utility script to inject all the package.json files into the container before running yarn install
# see also ../package.json build stage which should trigger this when building in CI

for dockerfile in ./docker/Dockerfile .rhdh/docker/Dockerfile; do
  # trim existing COPY lines
  sed -i "/# BEGIN COPY package.json files/,/# END COPY package.json files/c# BEGIN COPY package.json files\n# END COPY package.json files" $dockerfile
  # add new COPY lines
  for path in $(find . -name package.json | grep -v node_modules/ | sort -uV); do
    sed -i "s|\# BEGIN COPY package.json files|\# BEGIN COPY package.json files\nCOPY ${path/\./\$EXTERNAL_SOURCE_NESTED} $path|g" $dockerfile
  done
done
