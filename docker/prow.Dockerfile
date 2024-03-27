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

#  This Dockerfile used to run tests on OpenShift CI (Prow)

# Stage 1 - Build nodejs skeleton
FROM registry.access.redhat.com/ubi9/nodejs-20:1-34 AS skeleton
# hadolint ignore=DL3002
USER 0

# Install isolated-vm dependencies
# hadolint ignore=DL3041
RUN dnf install -y -q --allowerasing --nobest nodejs-devel nodejs-libs \
  # already installed or installed as deps:
  openssl openssl-devel ca-certificates make cmake cpp gcc gcc-c++ zlib zlib-devel brotli brotli-devel python3 nodejs-packaging \
    # required by ci-operator
    git && \
  dnf update -y && dnf clean all


# Upstream sources
ENV EXTERNAL_SOURCE=.
ENV EXTERNAL_SOURCE_NESTED=.
ENV CONTAINER_SOURCE=/opt/app-root/src

# Env vars
ENV YARN=$CONTAINER_SOURCE/.yarn/releases/yarn-4.1.1.cjs

WORKDIR $CONTAINER_SOURCE/
COPY $EXTERNAL_SOURCE_NESTED/.yarn ./.yarn
COPY $EXTERNAL_SOURCE_NESTED/.yarnrc.yml ./
RUN chmod +x $YARN

RUN $YARN install --immutable

# https://docs.ci.openshift.org/docs/architecture/ci-operator/#build-root-image
RUN mkdir -p /go
RUN chown -R 1001 /go

# Switch to nodejs user
USER 1001
