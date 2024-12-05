#!/bin/bash

handle_aks() {
  echo "Starting AKS deployment"
  for file in ${DIR}/cluster/aks/*.sh; do source $file; done

  export K8S_CLUSTER_URL=$(cat /tmp/secrets/RHDH_AKS_CLUSTER_URL)
  export K8S_CLUSTER_TOKEN=$(cat /tmp/secrets/RHDH_AKS_CLUSTER_TOKEN)
  export K8S_CLUSTER_ROUTER_BASE=$AKS_INSTANCE_DOMAIN_NAME
  export NAME_SPACE_K8S="showcase-k8s-ci-nightly"
  export NAME_SPACE_RBAC_K8S="showcase-rbac-k8s-ci-nightly"

  url="https://${K8S_CLUSTER_ROUTER_BASE}"

  az_login
  az_aks_start "${AKS_NIGHTLY_CLUSTER_NAME}" "${AKS_NIGHTLY_CLUSTER_RESOURCEGROUP}"
  az_aks_approuting_enable "${AKS_NIGHTLY_CLUSTER_NAME}" "${AKS_NIGHTLY_CLUSTER_RESOURCEGROUP}"
  az_aks_get_credentials "${AKS_NIGHTLY_CLUSTER_NAME}" "${AKS_NIGHTLY_CLUSTER_RESOURCEGROUP}"

  initiate_aks_deployment
  check_and_test "${RELEASE_NAME}" "${NAME_SPACE_K8S}" "${url}"
  delete_namespace "${NAME_SPACE_K8S}"
  initiate_rbac_aks_deployment
  local rbac_rhdh_base_url="https://${K8S_CLUSTER_ROUTER_BASE}"
  check_and_test "${RELEASE_NAME_RBAC}" "${NAME_SPACE_RBAC_K8S}" "${rbac_rhdh_base_url}"
  delete_namespace "${NAME_SPACE_RBAC_K8S}"
}


