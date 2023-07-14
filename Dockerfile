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
FROM registry.access.redhat.com/ubi9/nodejs-18:1 AS skeleton
USER 0

# Install isolated-vm dependencies
RUN dnf update -y && \
  dnf install -y zlib-devel brotli-devel

# Env vars
ENV YARN=./.yarn/releases/yarn-1.22.19.cjs

# Upstream sources
# Downstream comment
ENV EXTERNAL_SOURCE=.
ENV CONTAINER_SOURCE=/opt/app-root/src
#/ Downstream comment

# Downstream sources
# Downstream uncomment
# ENV EXTERNAL_SOURCE=$REMOTE_SOURCES/upstream1/app
# ENV CONTAINER_SOURCE=$REMOTE_SOURCES_DIR
#/ Downstream uncomment

WORKDIR $CONTAINER_SOURCE/
COPY $EXTERNAL_SOURCE/.yarn ./.yarn
COPY $EXTERNAL_SOURCE/.yarnrc.yml ./
RUN chmod +x $YARN

# Downstream uncomment
# COPY $EXTERNAL_SOURCE/../cachito.env $EXTERNAL_SOURCE/../registry-ca.pem ./
#/ Downstream uncomment

# Stage 2 - Install dependencies
FROM skeleton AS deps

COPY $EXTERNAL_SOURCE/package.json $EXTERNAL_SOURCE/yarn.lock ./
COPY $EXTERNAL_SOURCE/packages/app/package.json ./packages/app/package.json
COPY $EXTERNAL_SOURCE/packages/backend/package.json ./packages/backend/package.json

# see https://docs.engineering.redhat.com/pages/viewpage.action?pageId=228017926#UpstreamSources(Cachito,ContainerFirst)-CachitoIntegrationfornpm
# Downstream uncomment
# RUN source $CONTAINER_SOURCE/cachito.env && $YARN config set nodedir /usr; $YARN config set unsafe-perm true; # $YARN config list --verbose
#/ Downstream uncomment

RUN $YARN install --frozen-lockfile --network-timeout 600000

# Stage 3 - Build packages
FROM deps AS build

COPY $EXTERNAL_SOURCE ./

RUN git config --global --add safe.directory ./
RUN rm app-config.yaml && mv app-config.example.yaml app-config.yaml

# see https://docs.engineering.redhat.com/pages/viewpage.action?pageId=228017926#UpstreamSources(Cachito,ContainerFirst)-CachitoIntegrationfornpm
# Downstream uncomment
# RUN source $CONTAINER_SOURCE/cachito.env && $YARN config set nodedir /usr; $YARN config set unsafe-perm true; # $YARN config list --verbose
#/ Downstream uncomment

RUN $YARN build --filter=backend

# Stage 4 - Build the actual backend image and install production dependencies
FROM skeleton AS cleanup

# Copy the install dependencies from the build stage and context
COPY --from=build $CONTAINER_SOURCE/yarn.lock $CONTAINER_SOURCE/package.json $CONTAINER_SOURCE/packages/backend/dist/skeleton.tar.gz ./
RUN tar xzf skeleton.tar.gz && rm skeleton.tar.gz

# Copy the built packages from the build stage
COPY --from=build $CONTAINER_SOURCE/packages/backend/dist/bundle.tar.gz ./
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz

# Copy app-config files needed in runtime
COPY $EXTERNAL_SOURCE/app-config*.yaml ./

# see https://docs.engineering.redhat.com/pages/viewpage.action?pageId=228017926#UpstreamSources(Cachito,ContainerFirst)-CachitoIntegrationfornpm
# Downstream uncomment
# RUN source $CONTAINER_SOURCE/cachito.env && $YARN config set nodedir /usr; $YARN config set unsafe-perm true; # $YARN config list --verbose
#/ Downstream uncomment

# Install production dependencies
RUN $YARN install --frozen-lockfile --production --network-timeout 600000

# Stage 5 - Build the runner image
#@follow_tag(registry.redhat.io/ubi9/nodejs-18-minimal:1)
FROM registry.access.redhat.com/ubi9/nodejs-18-minimal:1 AS runner
USER 0

# Install techdocs dependencies
# Downstream comment
RUN microdnf update -y && \
  microdnf install -y python3 python3-pip && \
  pip3 install mkdocs-techdocs-core==1.2.1 && \
  microdnf clean all
#/ Downstream comment

# Env vars
ENV YARN=./.yarn/releases/yarn-1.22.19.cjs

# Upstream sources
# Downstream comment
ENV EXTERNAL_SOURCE=.
ENV CONTAINER_SOURCE=/opt/app-root/src
#/ Downstream comment

# Downstream sources
# Downstream uncomment
# ENV EXTERNAL_SOURCE=$REMOTE_SOURCES/upstream1/app
# ENV CONTAINER_SOURCE=$REMOTE_SOURCES_DIR
#/ Downstream uncomment

WORKDIR $CONTAINER_SOURCE/
COPY --from=cleanup --chown=1001:1001 $CONTAINER_SOURCE/ ./

# The fix-permissions script is important when operating in environments that dynamically use a random UID at runtime, such as OpenShift.
# The upstream backstage image does not account for this and it causes the container to fail at runtime.
RUN fix-permissions ./

# Switch to nodejs user
USER 1001

ENTRYPOINT ["node", "packages/backend", "--config", "app-config.yaml", "--config", "app-config.example.yaml", "--config", "app-config.example.production.yaml"]

# append Brew metadata here
