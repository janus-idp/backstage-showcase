#
# Copyright (c) 2023 Red Hat, Inc.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# To transform into Brew-friendly Dockerfile:
# 1. comment out lines with EXTERNAL_SOURCE=. and CONTAINER_SOURCE=/opt/app-root/src
# 2. uncomment lines with EXTERNAL_SOURCE and CONTAINER_SOURCE pointing at $REMOTE_SOURCES and $REMOTE_SOURCES_DIR instead (Brew defines these paths)
# 3. uncomment lines with RUN source .../cachito.env
# 4. add Brew metadata

# Stage 1 - Build nodejs skeleton
FROM registry.access.redhat.com/ubi9/nodejs-18:1-70.1697547871 AS skeleton
# hadolint ignore=DL3002
USER 0

# Install isolated-vm dependencies
# hadolint ignore=DL3041
RUN dnf install -y -q --allowerasing --nobest nodejs-devel nodejs-libs \
  # already installed or installed as deps:
  openssl openssl-devel ca-certificates make cmake cpp gcc gcc-c++ zlib zlib-devel brotli brotli-devel python3 nodejs-packaging && \
  dnf update -y && dnf clean all

# Env vars
ENV YARN=./.yarn/releases/yarn-1.22.19.cjs

# Upstream sources
ENV EXTERNAL_SOURCE=.
ENV EXTERNAL_SOURCE_NESTED=.
ENV CONTAINER_SOURCE=/opt/app-root/src

WORKDIR $CONTAINER_SOURCE/
COPY $EXTERNAL_SOURCE_NESTED/.yarn ./.yarn
COPY $EXTERNAL_SOURCE_NESTED/.yarnrc.yml ./
RUN chmod +x $YARN

# Stage 2 - Install dependencies
FROM skeleton AS deps

COPY $EXTERNAL_SOURCE_NESTED/dynamic-plugins/ ./dynamic-plugins/
COPY $EXTERNAL_SOURCE_NESTED/package.json $EXTERNAL_SOURCE_NESTED/yarn.lock ./
COPY $EXTERNAL_SOURCE_NESTED/packages/app/package.json ./packages/app/package.json
COPY $EXTERNAL_SOURCE_NESTED/packages/backend/package.json ./packages/backend/package.json
COPY $EXTERNAL_SOURCE_NESTED/plugins/scalprum-backend/package.json ./plugins/scalprum-backend/package.json

RUN $YARN install --frozen-lockfile --network-timeout 600000

# Stage 3 - Build packages
FROM deps AS build

COPY $EXTERNAL_SOURCE_NESTED ./

RUN git config --global --add safe.directory ./
# Upstream only
RUN rm app-config.yaml && mv app-config.example.yaml app-config.yaml

# hadolint ignore=DL3059
RUN $YARN build --filter=backend

# Build dynamic plugins
RUN $YARN export-dynamic
RUN $YARN copy-dynamic-plugins dist

# Stage 4 - Build the actual backend image and install production dependencies
FROM skeleton AS cleanup

# Upstream only - copy the install dependencies from the build stage and context
COPY --from=build $CONTAINER_SOURCE/yarn.lock \
     $CONTAINER_SOURCE/package.json \
     $CONTAINER_SOURCE/packages/backend/dist/skeleton.tar.gz \
     $CONTAINER_SOURCE/packages/backend/dist/bundle.tar.gz \
     ./
ENV TARBALL_PATH=.
RUN tar xzf $TARBALL_PATH/skeleton.tar.gz; tar xzf $TARBALL_PATH/bundle.tar.gz; \
    rm -f $TARBALL_PATH/skeleton.tar.gz $TARBALL_PATH/bundle.tar.gz

# Copy app-config files needed in runtime
# Upstream only
COPY $EXTERNAL_SOURCE_NESTED/app-config*.yaml ./
COPY $EXTERNAL_SOURCE_NESTED/dynamic-plugins.default.yaml ./

# Install production dependencies
# hadolint ignore=DL3059
RUN $YARN install --frozen-lockfile --production --network-timeout 600000

# Stage 5 - Build the runner image
FROM registry.access.redhat.com/ubi9/nodejs-18-minimal:1-74.1697537911 AS runner
USER 0

# Env vars
ENV YARN=./.yarn/releases/yarn-1.22.19.cjs

# Upstream sources
ENV CONTAINER_SOURCE=/opt/app-root/src

WORKDIR $CONTAINER_SOURCE/

# Upstream only - install techdocs dependencies (PyPI source tarballs not required)
RUN microdnf update -y && \
  microdnf install -y python3 python3-pip && \
  pip3 install mkdocs-techdocs-core==1.2.3 && \
  microdnf clean all

# Upstream only - copy from cleanup stage
COPY --from=cleanup --chown=1001:1001 $CONTAINER_SOURCE/ ./

# Copy python script used to gather dynamic plugins
COPY docker/install-dynamic-plugins.py ./
RUN chmod a+r ./install-dynamic-plugins.py

# Copy embedded dynamic plugins
COPY --from=build $CONTAINER_SOURCE/dynamic-plugins/dist/ ./dynamic-plugins/dist/
RUN chmod -R a+r ./dynamic-plugins/dist/

# Copy embedded dynamic plugins to default dynamic plugins root
RUN rm -f dynamic-plugins-root && cp -R dynamic-plugins/dist/ dynamic-plugins-root

# The fix-permissions script is important when operating in environments that dynamically use a random UID at runtime, such as OpenShift.
# The upstream backstage image does not account for this and it causes the container to fail at runtime.
RUN fix-permissions ./

# Switch to nodejs user
USER 1001

# Temporary workaround to avoid triggering issue
# https://github.com/backstage/backstage/issues/20644
ENV CHOKIDAR_USEPOLLING='1' CHOKIDAR_INTERVAL='10000'

ENTRYPOINT ["node", "packages/backend", "--config", "app-config.yaml", "--config", "app-config.example.yaml", "--config", "app-config.example.production.yaml"]

# append Brew metadata here
