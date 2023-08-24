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
# 4. remove python and pip installs from runtime container (not required)
# 5. add Brew metadata

# Stage 1 - Build nodejs skeleton
#@follow_tag(registry.redhat.io/ubi9/nodejs-18:1)
FROM registry.redhat.io/ubi9/nodejs-18:1 AS builder
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

# Downstream sources
ENV EXTERNAL_SOURCE=$REMOTE_SOURCES/upstream1/app
ENV EXTERNAL_SOURCE_NESTED=$EXTERNAL_SOURCE/distgit/containers/rhdh-hub
# /remote-source/
ENV CONTAINER_SOURCE=$REMOTE_SOURCES_DIR

WORKDIR $CONTAINER_SOURCE/
COPY $EXTERNAL_SOURCE_NESTED/.yarn ./.yarn
COPY $EXTERNAL_SOURCE_NESTED/.yarnrc.yml ./
RUN chmod +x $YARN

# Stage 2 - Install dependencies
COPY $EXTERNAL_SOURCE_NESTED/package.json $EXTERNAL_SOURCE_NESTED/yarn.lock ./
COPY $EXTERNAL_SOURCE_NESTED/packages/app/package.json ./packages/app/package.json
COPY $EXTERNAL_SOURCE_NESTED/packages/backend/package.json ./packages/backend/package.json

# Downstream only - debugging
# COPY $REMOTE_SOURCES/ ./
# hadolint ignore=SC2086
# RUN for d in $(find / -name ".npmrc" -o -name ".yarnrc" 2>/dev/null); do echo; echo "==== $d ===="; cat $d; done
# # ls -la ./ upstream1 upstream1/app/ upstream1/app/distgit/containers/ upstream1/app/distgit/containers/rhdh-hub/ || true
# # debug contents of /remote-source/
#  echo "###### /tmp/tls-ca-bundle.pem ######>>"; cat /tmp/tls-ca-bundle.pem; echo "<<###### /tmp/tls-ca-bundle.pem ######"
#  echo "###### $CONTAINER_SOURCE/registry-ca.pem ######>>"; cat $CONTAINER_SOURCE/registry-ca.pem; echo "<<###### $CONTAINER_SOURCE/registry-ca.pem ######"

# Downstream only - Cachito configuration
# see https://docs.engineering.redhat.com/pages/viewpage.action?pageId=228017926#UpstreamSources(Cachito,ContainerFirst)-CachitoIntegrationfornpm
COPY $REMOTE_SOURCES/upstream1/cachito.env \
     $REMOTE_SOURCES/upstream1/app/registry-ca.pem \
     $REMOTE_SOURCES/upstream1/app/distgit/containers/rhdh-hub/.npmrc \
     ./
# registry=https://cachito-nexus.engineering.redhat.com/repository/cachito-yarn-914335/
# email=noreply@domain.local
# always-auth=true
# //cachito-nexus.engineering.redhat.com/repository/cachito-yarn-914335/:_auth=Y2FjaGl0by15YXJuLTkxNDMzNTo2OWZjM2Q1NDVhMTA5ZGU1OGJmM2E5ZTliYg==
# fetch-retries=5
# fetch-retry-factor=2
# strict-ssl=true
# cafile="../../../registry-ca.pem"
# hadolint ignore=SC1091
RUN \
    # debug
    # ls -l $CONTAINER_SOURCE/cachito.env; \ 
    # load envs
    source $CONTAINER_SOURCE/cachito.env; \
    \
    # load cert
    cert_path=$CONTAINER_SOURCE/registry-ca.pem; \
    # debug
    # ls -la "${cert_path}"; \
    npm config set cafile "${cert_path}"; $YARN config set cafile "${cert_path}" -g; \
    \
    # debug
    # ls -l /usr/; \
    # set up node dir with common.gypi and unsafe-perms=true
    ln -s /usr/include/node/common.gypi /usr/common.gypi; $YARN config set nodedir /usr; $YARN config set unsafe-perm true
    # debug
    # cat $CONTAINER_SOURCE/.npmrc || true; \
    # $YARN config list --verbose; npm config list; npm config list -l

RUN $YARN install --frozen-lockfile --network-timeout 600000

# Stage 3 - Build packages
COPY $EXTERNAL_SOURCE_NESTED ./

RUN git config --global --add safe.directory ./
# Upstream only
# RUN rm app-config.yaml && mv app-config.example.yaml app-config.yaml

# hadolint ignore=DL3059
RUN $YARN build --filter=backend

# Stage 4 - Build the actual backend image and install production dependencies

# Downstream only - files already exist, nothing to copy - debugging
# RUN ls -l $CONTAINER_SOURCE/ $CONTAINER_SOURCE/packages/backend/dist/
ENV TARBALL_PATH=./packages/backend/dist
RUN tar xzf $TARBALL_PATH/skeleton.tar.gz; tar xzf $TARBALL_PATH/bundle.tar.gz; \
    rm -f $TARBALL_PATH/skeleton.tar.gz $TARBALL_PATH/bundle.tar.gz

# Copy app-config files needed in runtime
# Upstream only
# COPY $EXTERNAL_SOURCE_NESTED/app-config*.yaml ./

# Install production dependencies
# hadolint ignore=DL3059
RUN $YARN install --frozen-lockfile --production --network-timeout 600000

# Stage 5 - Build the runner image
#@follow_tag(registry.redhat.io/ubi9/nodejs-18-minimal:1)
FROM registry.redhat.io/ubi9/nodejs-18-minimal:1 AS runner
USER 0

# Downstream only - do not install techdocs dependencies (not required)

# Env vars
ENV YARN=./.yarn/releases/yarn-1.22.19.cjs

# Downstream sources
ENV CONTAINER_SOURCE=$REMOTE_SOURCES_DIR

WORKDIR $CONTAINER_SOURCE/
# Downstream only - copy from builder, not cleanup stage
COPY --from=builder --chown=1001:1001 $CONTAINER_SOURCE/ ./

# The fix-permissions script is important when operating in environments that dynamically use a random UID at runtime, such as OpenShift.
# The upstream backstage image does not account for this and it causes the container to fail at runtime.
RUN fix-permissions ./

# Switch to nodejs user
USER 1001

ENTRYPOINT ["node", "packages/backend", "--config", "app-config.yaml", "--config", "app-config.example.yaml", "--config", "app-config.example.production.yaml"]

# append Brew metadata here
