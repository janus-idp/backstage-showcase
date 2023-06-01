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
# Stage 1 - Install dependencies
#@follow_tag(registry.redhat.io/ubi9/nodejs-18:1)
FROM registry.access.redhat.com/ubi9/nodejs-18:1 AS deps
USER 0

# Env vars
ENV YARN=./.yarn/releases/yarn-1.22.19.cjs
ENV REMOTE_SOURCES=.
ENV REMOTE_SOURCES_DIR=/opt/app-root/src

WORKDIR $REMOTE_SOURCES_DIR
COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR
RUN chmod +x $REMOTE_SOURCES_DIR/.yarn/releases/yarn-1.22.19.cjs

# Remove all files except package.json
RUN find packages -mindepth 2 -maxdepth 2 \! -name "package.json" -exec rm -rf {} \+

RUN $YARN install --frozen-lockfile --network-timeout 600000 --ignore-scripts

# Stage 2 - Build packages
#@follow_tag(registry.redhat.io/ubi9/nodejs-18:1)
FROM registry.access.redhat.com/ubi9/nodejs-18:1 AS build
USER 0

# Env vars
ENV YARN=./.yarn/releases/yarn-1.22.19.cjs
ENV REMOTE_SOURCES=.
ENV REMOTE_SOURCES_DIR=/opt/app-root/src

WORKDIR $REMOTE_SOURCES_DIR
COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR
COPY --from=deps $REMOTE_SOURCES_DIR $REMOTE_SOURCES_DIR
RUN chmod +x $REMOTE_SOURCES_DIR/.yarn/releases/yarn-1.22.19.cjs
RUN git config --global --add safe.directory $REMOTE_SOURCES_DIR
RUN rm $REMOTE_SOURCES_DIR/app-config.yaml && mv $REMOTE_SOURCES_DIR/app-config.example.yaml $REMOTE_SOURCES_DIR/app-config.yaml

RUN $YARN build --filter=backend

# Stage 3 - Build the actual backend image and install production dependencies
#@follow_tag(registry.redhat.io/ubi9/nodejs-18-minimal:1)
FROM registry.access.redhat.com/ubi9/nodejs-18-minimal:1 AS runner
USER 0

# Install gzip for tar and clean up
RUN microdnf install -y gzip python3 python3-pip && \
    pip3 install mkdocs-techdocs-core==1.2.1 && \
    microdnf clean all

# Env vars
ENV YARN=./.yarn/releases/yarn-1.22.19.cjs
ENV REMOTE_SOURCES=.
ENV REMOTE_SOURCES_DIR=/opt/app-root/src

WORKDIR $REMOTE_SOURCES_DIR
COPY --from=build --chown=1001:1001 $REMOTE_SOURCES_DIR/.yarn $REMOTE_SOURCES_DIR/.yarn
COPY --from=build --chown=1001:1001 $REMOTE_SOURCES_DIR/.yarnrc.yml $REMOTE_SOURCES_DIR/
RUN chmod +x $REMOTE_SOURCES_DIR/.yarn/releases/yarn-1.22.19.cjs

# Copy the install dependencies from the build stage and context
COPY --from=build --chown=1001:1001 $REMOTE_SOURCES_DIR/yarn.lock $REMOTE_SOURCES_DIR/package.json $REMOTE_SOURCES_DIR/packages/backend/dist/skeleton.tar.gz $REMOTE_SOURCES_DIR/
RUN tar xzf skeleton.tar.gz && rm skeleton.tar.gz

# Copy the built packages from the build stage
COPY --from=build --chown=1001:1001 $REMOTE_SOURCES_DIR/packages/backend/dist/bundle.tar.gz $REMOTE_SOURCES_DIR
RUN tar xzf $REMOTE_SOURCES_DIR/bundle.tar.gz && rm $REMOTE_SOURCES_DIR/bundle.tar.gz

# Copy any other files that we need at runtime
COPY --chown=1001:1001 $REMOTE_SOURCES/app-config.yaml $REMOTE_SOURCES/app-config.production.yaml $REMOTE_SOURCES/app-config.example.yaml $REMOTE_SOURCES/app-config.example.production.yaml $REMOTE_SOURCES_DIR

# Install production dependencies
RUN $YARN install --frozen-lockfile --production --network-timeout 600000 --ignore-scripts && $YARN cache clean

# The fix-permissions script is important when operating in environments that dynamically use a random UID at runtime, such as OpenShift.
# The upstream backstage image does not account for this and it causes the container to fail at runtime.
RUN fix-permissions $REMOTE_SOURCES_DIR

# Switch to nodejs user
USER 1001

ENTRYPOINT ["node", "packages/backend", "--config", "app-config.yaml", "--config", "app-config.example.yaml", "--config", "app-config.example.production.yaml"]
