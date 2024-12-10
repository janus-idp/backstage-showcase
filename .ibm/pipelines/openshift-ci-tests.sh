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
  # elif [[ "$JOB_NAME" == *pull-*-main-e2e-tests* ]]; then
  #   # Cleanup namespaces after main branch PR e2e tests execution.
  #   delete_namespace "${NAME_SPACE}"
  #   delete_namespace "${NAME_SPACE_POSTGRES_DB}"
  #   delete_namespace "${NAME_SPACE_RBAC}"
  fi
  rm -rf ~/tmpbin
}

trap cleanup EXIT INT ERR

if [ "$JOB_TYPE" == "presubmit" ] && [[ "$JOB_NAME" != rehearse-* ]]; then
  export K8S_CLUSTER_URL=$(cat /tmp/secrets/RHDH_OSD_GCP_CLUSTER_URL)
  export K8S_CLUSTER_TOKEN=$(cat /tmp/secrets/RHDH_OSD_GCP_CLUSTER_TOKEN)
fi

SCRIPTS=(
    "env_variables.sh"
    "utils.sh"
    "jobs/aks.sh"
    "jobs/gke.sh"
    "jobs/main.sh"
    "jobs/ocp-v4-15.sh"
    "jobs/ocp-v4-16.sh"
    "jobs/operator.sh"
    "jobs/periodic.sh"
)

# Source each script dynamically
for SCRIPT in "${SCRIPTS[@]}"; do
    source "${DIR}/${SCRIPT}"
    echo "Loaded ${SCRIPT}"
done

main() {
  echo "Log file: ${LOGFILE}"
  echo "JOB_NAME : $JOB_NAME"
  echo "Cluster Console URL: $(oc whoami --show-console)"
  echo "Note: This cluster will be automatically deleted 4 hours after being claimed."
  echo "To debug issues or log in to the cluster manually, use the script: .ibm/pipelines/ocp-cluster-claim-login.sh"

  case "$JOB_NAME" in
    *aks*)
      echo "Calling handle_aks"
      handle_aks
      ;;
    *gke*)
      echo "Calling handle_gke"
       handle_gke
      ;;
    *operator*)
      echo "Calling Operator"
      handle_operator
      ;;
    *periodic*)
      echo "Calling handle_periodic"
      handle_nightly
      ;;
    *pull*)
      echo "Calling handle_main"
      handle_main
      ;;
  esac

echo "K8S_CLUSTER_ROUTER_BASE : $K8S_CLUSTER_ROUTER_BASE"
echo "Main script completed with result: ${OVERALL_RESULT}"
exit "${OVERALL_RESULT}"

}

main
