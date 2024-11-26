#!/bin/sh

handle_gke() {
  gcloud_auth "${GKE_SERVICE_ACCOUNT_NAME}" "/tmp/secrets/GKE_SERVICE_ACCOUNT_KEY"
  initiate_deployments
  check_and_test "${RELEASE_NAME}" "${NAME_SPACE_K8S}"
  delete_namespace "${NAME_SPACE_K8S}"
}
