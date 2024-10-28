#!/bin/sh

retrieve_pod_logs() {
  local pod_name=$1; local container=$2; local namespace=$3
  echo "  Retrieving logs for container: $container"
  # Save logs for the current and previous container
  kubectl logs $pod_name -c $container -n $namespace > "pod_logs/${pod_name}_${container}.log" || { echo "  logs for container $container not found"; }
  kubectl logs $pod_name -c $container -n $namespace --previous > "pod_logs/${pod_name}_${container}-previous.log" 2>/dev/null || { echo "  Previous logs for container $container not found"; rm -f "pod_logs/${pod_name}_${container}-previous.log"; }
}

save_all_pod_logs(){
  set +e
  local namespace=$1
  mkdir -p pod_logs

  # Get all pod names in the namespace
  pod_names=$(kubectl get pods -n $namespace -o jsonpath='{.items[*].metadata.name}')
  for pod_name in $pod_names; do
    echo "Retrieving logs for pod: $pod_name in namespace $namespace"

    init_containers=$(kubectl get pod $pod_name -n $namespace -o jsonpath='{.spec.initContainers[*].name}')
    # Loop through each init container and retrieve logs
    for init_container in $init_containers; do
      retrieve_pod_logs $pod_name $init_container $namespace
    done
    
    containers=$(kubectl get pod $pod_name -n $namespace -o jsonpath='{.spec.containers[*].name}')
    for container in $containers; do
      retrieve_pod_logs $pod_name $container $namespace
    done
  done

  mkdir -p "${ARTIFACT_DIR}/${namespace}/pod_logs"
  cp -a pod_logs/* "${ARTIFACT_DIR}/${namespace}/pod_logs"
  set -e
}

droute_send() {
  # Skipping ReportPortal for nightly jobs on OCP v4.14 and v4.13 for now, as new clusters are not behind the RH VPN.
  if [[ "$JOB_NAME" == *ocp-v4* ]]; then
    return 0
  fi

  local droute_version="1.2"
  local release_name=$1
  local project=$2
  local droute_project="droute"
  local droute_pod_name=$(oc get pods -n droute --no-headers -o custom-columns=":metadata.name" | grep ubi9-cert-rsync)
  METEDATA_OUTPUT="data_router_metadata_output.json"

  # Remove properties (only used for skipped test and invalidates the file if empty)
  sed -i '/<properties>/,/<\/properties>/d' "${ARTIFACT_DIR}/${project}/${JUNIT_RESULTS}"

  JOB_BASE_URL="https://prow.ci.openshift.org/view/gs/test-platform-results"
  if [ -n "${PULL_NUMBER:-}" ]; then
    JOB_URL="${JOB_BASE_URL}/pr-logs/pull/${REPO_OWNER}_${REPO_NAME}/${PULL_NUMBER}/${JOB_NAME}/${BUILD_ID}"
  else
    JOB_URL="${JOB_BASE_URL}/logs/${JOB_NAME}/${BUILD_ID}"
  fi

  jq \
    --arg hostname "$REPORTPORTAL_HOSTNAME" \
    --arg project "$DATA_ROUTER_PROJECT" \
    --arg name "$JOB_NAME" \
    --arg description "[View job run details](${JOB_URL})" \
    --arg key1 "job_type" \
    --arg value1 "$JOB_TYPE" \
    --arg key2 "pr" \
    --arg value2 "$GIT_PR_NUMBER" \
    --arg auto_finalization_treshold $DATA_ROUTER_AUTO_FINALIZATION_TRESHOLD \
    '.targets.reportportal.config.hostname = $hostname |
     .targets.reportportal.config.project = $project |
     .targets.reportportal.processing.launch.name = $name |
     .targets.reportportal.processing.launch.description = $description |
     .targets.reportportal.processing.launch.attributes += [
        {"key": $key1, "value": $value1},
        {"key": $key2, "value": $value2}
      ] |
     .targets.reportportal.processing.tfa.auto_finalization_threshold = ($auto_finalization_treshold | tonumber)
     ' data_router/data_router_metadata_template.json > "${ARTIFACT_DIR}/${project}/${METEDATA_OUTPUT}"

  oc rsync -n "${droute_project}" "${ARTIFACT_DIR}/${project}/" "${droute_project}/${droute_pod_name}:/tmp/droute"

  oc exec -n "${droute_project}" "${droute_pod_name}" -- /bin/bash -c "
    curl -fsSLk -o /tmp/droute-linux-amd64 'https://${NEXUS_HOSTNAME}/nexus/repository/dno-raw/droute-client/${droute_version}/droute-linux-amd64' && chmod +x /tmp/droute-linux-amd64"

  oc exec -n "${droute_project}" "${droute_pod_name}" -- /bin/bash -c "
    /tmp/droute-linux-amd64 send --metadata /tmp/droute/${METEDATA_OUTPUT} \
    --url '${DATA_ROUTER_URL}' \
    --username '${DATA_ROUTER_USERNAME}' \
    --password '${DATA_ROUTER_PASSWORD}' \
    --results '/tmp/droute/${JUNIT_RESULTS}' \
    --verbose"

}

wait_for_deployment() {
    local namespace=$1
    local resource_name=$2
    local timeout_minutes=${3:-5}
    local check_interval=${4:-10}
    
    if [[ -z "$namespace" || -z "$resource_name" ]]; then
        echo "Error: Missing required parameters"
        echo "Usage: wait_for_deployment <namespace> <resource-name> [timeout_minutes] [check_interval_seconds]"
        echo "Example: wait_for_deployment my-namespace my-deployment 5 10"
        return 1
    fi

    local max_attempts=$((timeout_minutes * 60 / check_interval))
    
    echo "Waiting for resource '$resource_name' in namespace '$namespace' (timeout: ${timeout_minutes}m)..."
    
    for ((i=1; i<=max_attempts; i++)); do
        # Get pod name
        local pod_name=$(oc get pods -n "$namespace" | grep "$resource_name" | awk '{print $1}' | head -n 1)
        
        if [[ -n "$pod_name" ]]; then
            # Check if pod is ready
            local is_ready=$(oc get pod "$pod_name" -n "$namespace" -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}')
            
            if [[ "$is_ready" == "True" ]] && \
               oc get pod "$pod_name" -n "$namespace" | grep -q "Running"; then
                echo "Pod '$pod_name' is running and ready"
                return 0
            else
                echo "Pod '$pod_name' is not ready (Ready: $is_ready)"
            fi
        else
            echo "No pods found matching '$resource_name' in namespace '$namespace'"
        fi
        
        echo "Still waiting... (${i}/${max_attempts} checks)"
        sleep "$check_interval"
    done

    echo "Timeout waiting for resource to be ready. Please check:"
    echo "oc get pods -n $namespace | grep $resource_name"
    return 1
}

install_subscription(){
  name=$1
  namespace=$2
  package=$3
  channel=$4
  source_name=$5
  oc apply -f - << EOD
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: $name
  namespace: $namespace
spec:
  channel: $channel
  installPlanApproval: Automatic
  name: $package
  source: $source_name
  sourceNamespace: openshift-marketplace
EOD
}

install_crunchy_postgres_operator(){
  install_subscription crunchy-postgres-operator openshift-operators crunchy-postgres-operator v5 certified-operators
}

install_pipelines_operator() {
  DISPLAY_NAME="Red Hat OpenShift Pipelines"
  if oc get csv -n "openshift-operators" | grep -q "${DISPLAY_NAME}"; then
    echo "Red Hat OpenShift Pipelines operator is already installed."
  else
    echo "Red Hat OpenShift Pipelines operator is not installed. Installing..."
    install_subscription openshift-pipelines-operator openshift-operators openshift-pipelines-operator-rh latest redhat-operators
    wait_for_deployment "openshift-operators" "pipelines"
  fi
}
