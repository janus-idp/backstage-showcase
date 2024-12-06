#!/bin/sh

set -xe
export PS4='[$(date "+%Y-%m-%d %H:%M:%S")] ' # logs timestamp for every cmd.

LOGFILE="test-log"
export DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
secret_name="rhdh-k8s-plugin-secret"
OVERALL_RESULT=0

cleanup() {
  echo "Cleaning up before exiting"
  if [[ "$JOB_NAME" == *aks* ]]; then
    az_aks_stop "${AKS_NIGHTLY_CLUSTER_NAME}" "${AKS_NIGHTLY_CLUSTER_RESOURCEGROUP}"
  elif [[ "$JOB_NAME" == *pull-*-main-e2e-tests* ]]; then
    # Cleanup namespaces after main branch PR e2e tests execution.
    delete_namespace "${NAME_SPACE}"
    delete_namespace "${NAME_SPACE_POSTGRES_DB}"
    delete_namespace "${NAME_SPACE_RBAC}"
  fi
  rm -rf ~/tmpbin
}

trap cleanup EXIT INT ERR

export K8S_CLUSTER_URL=$(cat /tmp/secrets/RHDH_PR_OS_CLUSTER_URL)
export K8S_CLUSTER_TOKEN=$(cat /tmp/secrets/RHDH_PR_OS_CLUSTER_TOKEN)

source "${DIR}/env_variables.sh"
echo "Loaded env_variables.sh"
source "${DIR}/utils.sh"
echo "Loaded utils.sh"
source "${DIR}/jobs/aks.sh"
echo "Loaded aks.sh"
source "${DIR}/jobs/gke.sh"
echo "Loaded gke.sh"
source "${DIR}/jobs/main.sh"
echo "Loaded main.sh"
source "${DIR}/jobs/ocp-v4-15.sh"
echo "Loaded ocp-v4-15.sh"
source "${DIR}/jobs/ocp-v4-16.sh"
echo "Loaded ocp-v4-16.sh"
source "${DIR}/jobs/operator.sh"
echo "Loaded operator.sh"
source "${DIR}/jobs/periodic.sh"
echo "Loaded periodic.sh"

main() {
  echo "Log file: ${LOGFILE}"
  echo "JOB_NAME : $JOB_NAME"

  case "$JOB_NAME" in
    *aks*)
      echo "Calling handle_aks"
      handle_aks
      ;;
    *gke*)
      echo "Calling handle_gke"
       handle_gke
      ;;
    *periodic*)
      echo "Calling handle_periodic"
      handle_nightly
      ;;
    *pull-*-main-e2e-tests*)
      echo "Calling handle_main"
      handle_main
      ;;
    *ocp-v4-16*)
      echo "Calling handle_ocp_v4_16"
      handle_ocp_v4_16
      ;;
    *ocp-v4-15*)
      echo "Calling handle_ocp_v4_15"
      handle_ocp_v4_15
      ;;
    *operator*)
      echo "Calling Operator"
      handle_operator
      ;;
  esac

echo "K8S_CLUSTER_ROUTER_BASE : $K8S_CLUSTER_ROUTER_BASE"
echo "Main script completed with result: ${OVERALL_RESULT}"
exit "${OVERALL_RESULT}"

}

main
