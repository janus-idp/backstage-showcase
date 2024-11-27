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
#. "${DIR}/operator.sh"
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
#    *operator*)
#      handle_operator
#      ;;
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
