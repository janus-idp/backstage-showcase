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
# 1. remove ENV REMOTE_SOURCES and REMOTE_SOURCES_DIR (Brew will set its own values: REMOTE_SOURCES=unpacked_remote_sources and REMOTE_SOURCES_DIR=/remote-source)
# 2. replace $REMOTE_SOURCES_DIR/ with $REMOTE_SOURCES_DIR/upstream1/app/ (full path to where sources are copied via Brew)
# 3. replace $REMOTE_SOURCES/ with $REMOTE_SOURCES/upstream1/app/ (full path to where sources are copied via Brew)
# 4. add RUN source $REMOTE_SOURCES_DIR/upstream1/cachito.env after each COPY into REMOTE_SOURCES_DIR
# 5. before each yarn install/build, add '$YARN config set nodedir /usr; $YARN config set unsafe-perm true;'
# 6. remove python and pip installs from runtime container (not required)
# 7. copy ALL of REMOTE_SOURCES to REMOTE_SOURCES_DIR, not just upstream1/cachito.env and upstream1/app/registry-ca.pem
# 8. add Brew metadata

# Stage 1 - Build nodejs skeleton
#@follow_tag(registry.redhat.io/ubi9/nodejs-18:1)
FROM registry.access.redhat.com/ubi9/nodejs-18:1 AS skeleton
USER 0

# Install isolate-vm dependencies
RUN dnf update -y && \
  dnf install -y zlib-devel brotli-devel && \
  dnf clean all

# Env vars
ENV YARN=./.yarn/releases/yarn-1.22.19.cjs
ENV REMOTE_SOURCES=.
ENV REMOTE_SOURCES_DIR=/opt/app-root/src

WORKDIR $REMOTE_SOURCES_DIR/
COPY $REMOTE_SOURCES/.yarn $REMOTE_SOURCES_DIR/.yarn
COPY $REMOTE_SOURCES/.yarnrc.yml $REMOTE_SOURCES_DIR/
RUN chmod +x $REMOTE_SOURCES_DIR/$YARN

# Stage 2 - Install dependencies
FROM skeleton AS deps

COPY $REMOTE_SOURCES/package.json $REMOTE_SOURCES/yarn.lock $REMOTE_SOURCES_DIR
COPY $REMOTE_SOURCES/packages/app/package.json $REMOTE_SOURCES_DIR/packages/app/package.json
COPY $REMOTE_SOURCES/packages/backend/package.json $REMOTE_SOURCES_DIR/packages/backend/package.json

RUN $YARN install --frozen-lockfile --network-timeout 600000

# Stage 3 - Build packages
FROM deps AS build

COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR

RUN git config --global --add safe.directory $REMOTE_SOURCES_DIR/
RUN rm $REMOTE_SOURCES_DIR/app-config.yaml && mv $REMOTE_SOURCES_DIR/app-config.example.yaml $REMOTE_SOURCES_DIR/app-config.yaml

RUN $YARN build --filter=backend

# Stage 4 - Build the actual backend image and install production dependencies
FROM skeleton AS cleanup

# Copy the install dependencies from the build stage and context
COPY --from=build $REMOTE_SOURCES_DIR/yarn.lock $REMOTE_SOURCES_DIR/package.json $REMOTE_SOURCES_DIR/packages/backend/dist/skeleton.tar.gz $REMOTE_SOURCES_DIR/
RUN tar xzf skeleton.tar.gz && rm skeleton.tar.gz

# Copy the built packages from the build stage
COPY --from=build $REMOTE_SOURCES_DIR/packages/backend/dist/bundle.tar.gz $REMOTE_SOURCES_DIR/
RUN tar xzf $REMOTE_SOURCES_DIR/bundle.tar.gz && rm $REMOTE_SOURCES_DIR/bundle.tar.gz

# Copy app-config files needed in runtime
COPY $REMOTE_SOURCES/app-config*.yaml $REMOTE_SOURCES_DIR/

# Install production dependencies
RUN $YARN install --frozen-lockfile --production --network-timeout 600000 && $YARN cache clean

# Stage 5 - Build the runner image
#@follow_tag(registry.redhat.io/ubi9/nodejs-18-minimal:1)
FROM registry.access.redhat.com/ubi9/nodejs-18-minimal:1 AS runner
USER 0

# Install techdocs dependencies
RUN microdnf update -y && \
  microdnf install -y python3 python3-pip && \
  pip3 install mkdocs-techdocs-core==1.2.1 && \
  microdnf clean all

# Env vars
ENV YARN=./.yarn/releases/yarn-1.22.19.cjs
ENV REMOTE_SOURCES=.
ENV REMOTE_SOURCES_DIR=/opt/app-root/src

WORKDIR $REMOTE_SOURCES_DIR/
COPY --from=cleanup --chown=1001:1001 $REMOTE_SOURCES_DIR/ $REMOTE_SOURCES_DIR/

# The fix-permissions script is important when operating in environments that dynamically use a random UID at runtime, such as OpenShift.
# The upstream backstage image does not account for this and it causes the container to fail at runtime.
RUN fix-permissions $REMOTE_SOURCES_DIR/

# Switch to nodejs user
USER 1001

ENTRYPOINT ["node", "packages/backend", "--config", "app-config.yaml", "--config", "app-config.example.yaml", "--config", "app-config.example.production.yaml"]

# append Brew metadata here
