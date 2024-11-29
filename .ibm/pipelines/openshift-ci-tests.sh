#!/bin/bash

set -xe
export PS4='[$(date "+%Y-%m-%d %H:%M:%S")] '

LOGFILE="test-log"
DIR="$(cd "$(dirname "$0")" && pwd)"
OVERALL_RESULT=0

# Load utility and environment-specific scripts
. "${DIR}/utils.sh"
. "${DIR}/postgres.sh"
. "${DIR}/aks.sh"
. "${DIR}/gke.sh"
. "${DIR}/nightly.sh"
. "${DIR}/finalizers.sh"
. "${DIR}/deployments.sh"

cleanup() {
  echo "Cleaning up before exiting"
  perform_cleanup
  rm -rf ~/tmpbin
}

trap cleanup EXIT INT ERR

main() {
  echo "Log file: ${LOGFILE}"
  set_cluster_info
  . "${DIR}/env_variables.sh"

  if [[ "$JOB_NAME" == *aks* ]]; then
      az_login
      export K8S_CLUSTER_ROUTER_BASE="$AKS_INSTANCE_DOMAIN_NAME"
      az_aks_start "${AKS_NIGHTLY_CLUSTER_NAME}" "${AKS_NIGHTLY_CLUSTER_RESOURCEGROUP}"
      az_aks_approuting_enable "${AKS_NIGHTLY_CLUSTER_NAME}" "${AKS_NIGHTLY_CLUSTER_RESOURCEGROUP}"
      az_aks_get_credentials "${AKS_NIGHTLY_CLUSTER_NAME}" "${AKS_NIGHTLY_CLUSTER_RESOURCEGROUP}"
    elif [[ "$JOB_NAME" == *gke* ]]; then
      gcloud_auth "${GKE_SERVICE_ACCOUNT_NAME}" "/tmp/secrets/GKE_SERVICE_ACCOUNT_KEY"
      gcloud_gke_get_credentials "${GKE_CLUSTER_NAME}" "${GKE_CLUSTER_REGION}" "${GOOGLE_CLOUD_PROJECT}"
      export K8S_CLUSTER_ROUTER_BASE="$GKE_INSTANCE_DOMAIN_NAME"
    else
      oc login --token="${K8S_CLUSTER_TOKEN}" --server="${K8S_CLUSTER_URL}"
      export K8S_CLUSTER_ROUTER_BASE=$(oc get route console -n openshift-console -o=jsonpath='{.spec.host}' | sed 's/^[^.]*\.//')
    fi

    echo "K8S_CLUSTER_ROUTER_BASE: $K8S_CLUSTER_ROUTER_BASE"
    echo "Cluster login complete. OCP version: $(oc version)"

  set_namespace

  case "$JOB_NAME" in
    *aks*)
      initiate_aks_deployment
      check_and_test "${RELEASE_NAME}" "${NAME_SPACE_K8S}"
      delete_namespace "${NAME_SPACE_K8S}"
      initiate_rbac_aks_deployment
      check_and_test "${RELEASE_NAME_RBAC}" "${NAME_SPACE_RBAC_K8S}"
      delete_namespace "${NAME_SPACE_RBAC_K8S}"
      ;;
    *gke*)
      initiate_gke_deployment
      check_and_test "${RELEASE_NAME}" "${NAME_SPACE_K8S}"
      delete_namespace "${NAME_SPACE_K8S}"
      initiate_rbac_gke_deployment
      check_and_test "${RELEASE_NAME_RBAC}" "${NAME_SPACE_RBAC_K8S}"
      delete_namespace "${NAME_SPACE_RBAC_K8S}"
      ;;
    *periodic*)
      handle_nightly
      ;;
    *)
      initiate_deployments
      check_and_test "${RELEASE_NAME}" "${NAME_SPACE}"
      check_and_test "${RELEASE_NAME_RBAC}" "${NAME_SPACE_RBAC}"
      ;;
  esac

  exit "${OVERALL_RESULT}"
}

main
