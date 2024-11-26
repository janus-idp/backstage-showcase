#!/bin/sh

handle_aks() {
  az_login
  az_aks_start "${AKS_NIGHTLY_CLUSTER_NAME}" "${AKS_NIGHTLY_CLUSTER_RESOURCEGROUP}"
  initiate_deployments
  check_and_test "${RELEASE_NAME}" "${NAME_SPACE_K8S}"
  delete_namespace "${NAME_SPACE_K8S}"
}
