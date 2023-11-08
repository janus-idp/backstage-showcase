#!/bin/bash -ex
#
# Copyright (c) 2018 Red Hat, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# This script builds and deploys the Web-RCA Service. In order to
# work, it needs the following variables defined in the CI/CD configuration of
# the project:
#
# QUAY_USER - The name of the robot account used to push images to
# 'quay.io', for example 'openshift-unified-hybrid-cloud+jenkins'.
#
# QUAY_TOKEN - The token of the robot account used to push images to
# 'quay.io'.
#
# The machines that run this script need to have access to internet, so that
# the built images can be pushed to quay.io.
#
#
# Optional variable:
#
# QUAY_REPOSITORY - The (quay) repository to use. Defaults to 'app-sre/web-rca'
#
#
# To debug run like this:
# QUAY_REPOSITORY="openshift-unified-hybrid-cloud/web-rca" QUAY_TOKEN=$(cat .quay-pass) QUAY_USER=martin_povolny ./build_deploy.sh
# note that you might need to change the GOROOT below or install Go in the specified path.
#

#REPO="${QUAY_REPOSITORY:-janus-idp/redhat-backstage-build}"
REPO="${QUAY_REPOSITORY:-sreaves/redhat-backstage-build}"

# The version should be the short hash from git. This is what the deployent process expects.
VERSION="$(git log --pretty=format:'%h' -n 1)"

podman build -f docker/Dockerfile -t "quay.io/${REPO}:${VERSION}" .
podman tag "quay.io/${REPO}:${VERSION}" "quay.io/${REPO}:latest"

# Log in to the image registry:
if [ -z "${QUAY_USER}" ]; then
  echo "The 'quay.io' push user name hasn't been provided."
  echo "Make sure to set the 'QUAY_USER' environment variable."
  exit 1
fi
if [ -z "${QUAY_TOKEN}" ]; then
  echo "The 'quay.io' push token hasn't been provided."
  echo "Make sure to set the 'QUAY_TOKEN' environment variable."
  exit 1
fi

podman push --creds="${QUAY_USER}:${QUAY_TOKEN}" "quay.io/${REPO}:${VERSION}"
podman push --creds="${QUAY_USER}:${QUAY_TOKEN}" "quay.io/${REPO}:latest"
