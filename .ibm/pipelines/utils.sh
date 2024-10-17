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
  temp_kubeconfig=$(mktemp) # Create temporary KUBECONFIG to open second `oc` session
  ( # Open subshell
    export KUBECONFIG="$temp_kubeconfig"
    local droute_version="1.2.2"
    local release_name=$1
    local project=$2
    local droute_project="droute"
    METEDATA_OUTPUT="data_router_metadata_output.json"
    
    oc login --token="${RHDH_PR_OS_CLUSTER_TOKEN}" --server="${RHDH_PR_OS_CLUSTER_URL}"
    oc whoami --show-server
    local droute_pod_name=$(oc get pods -n droute --no-headers -o custom-columns=":metadata.name" | grep ubi9-cert-rsync)
    local temp_droute=$(oc exec -n "${droute_project}" "${droute_pod_name}" -- /bin/bash -c "mktemp -d")

    JOB_BASE_URL="https://prow.ci.openshift.org/view/gs/test-platform-results"
    if [ -n "${PULL_NUMBER:-}" ]; then
      JOB_URL="${JOB_BASE_URL}/pr-logs/pull/${REPO_OWNER}_${REPO_NAME}/${PULL_NUMBER}/${JOB_NAME}/${BUILD_ID}"
      ARTIFACTS_URL="https://gcsweb-ci.apps.ci.l2s4.p1.openshiftapps.com/gcs/test-platform-results/pr-logs/pull/${REPO_OWNER}_${REPO_NAME}/${PULL_NUMBER}/${JOB_NAME}/${BUILD_ID}/artifacts/e2e-tests/${REPO_OWNER}-${REPO_NAME}/artifacts/${project}"
    else
      JOB_URL="${JOB_BASE_URL}/logs/${JOB_NAME}/${BUILD_ID}"
      ARTIFACTS_URL="https://gcsweb-ci.apps.ci.l2s4.p1.openshiftapps.com/gcs/test-platform-results/logs/${JOB_NAME}/${BUILD_ID}/artifacts/${JOB_NAME##periodic-ci-janus-idp-backstage-showcase-main-}/${REPO_OWNER}-${REPO_NAME}/artifacts/${project}"
    fi

    # Remove properties (only used for skipped test and invalidates the file if empty)
    sed -i '/<properties>/,/<\/properties>/d' "${ARTIFACT_DIR}/${project}/${JUNIT_RESULTS}"
    # Replace attachments with link to OpenShift CI storage
    sed -iE "s#\[\[ATTACHMENT|\(.*\)\]\]#${ARTIFACTS_URL}/\1#g" "${ARTIFACT_DIR}/${project}/${JUNIT_RESULTS}"

    jq \
      --arg hostname "$REPORTPORTAL_HOSTNAME" \
      --arg project "$DATA_ROUTER_PROJECT" \
      --arg name "$JOB_NAME" \
      --arg description "[View job run details](${JOB_URL})" \
      --arg key1 "job_type" \
      --arg value1 "$JOB_TYPE" \
      --arg key2 "pr" \
      --arg value2 "$GIT_PR_NUMBER" \
      --arg key3 "job_name" \
      --arg value3 "$JOB_NAME" \
      --arg key4 "tag_name" \
      --arg value4 "$TAG_NAME" \
      --arg auto_finalization_treshold $DATA_ROUTER_AUTO_FINALIZATION_TRESHOLD \
      '.targets.reportportal.config.hostname = $hostname |
      .targets.reportportal.config.project = $project |
      .targets.reportportal.processing.launch.name = $name |
      .targets.reportportal.processing.launch.description = $description |
      .targets.reportportal.processing.launch.attributes += [
          {"key": $key1, "value": $value1},
          {"key": $key2, "value": $value2},
          {"key": $key3, "value": $value3},
          {"key": $key4, "value": $value4}
        ] |
      .targets.reportportal.processing.tfa.auto_finalization_threshold = ($auto_finalization_treshold | tonumber)
      ' data_router/data_router_metadata_template.json > "${ARTIFACT_DIR}/${project}/${METEDATA_OUTPUT}"

    oc rsync --include="${METEDATA_OUTPUT}" --include="${JUNIT_RESULTS}" --exclude="*" -n "${droute_project}" "${ARTIFACT_DIR}/${project}/" "${droute_project}/${droute_pod_name}:${temp_droute}/"

    # "Install" Data Router
    oc exec -n "${droute_project}" "${droute_pod_name}" -- /bin/bash -c "
      curl -fsSLk -o /tmp/droute-linux-amd64 'https://${DATA_ROUTER_NEXUS_HOSTNAME}/nexus/repository/dno-raw/droute-client/${droute_version}/droute-linux-amd64' \
      && chmod +x /tmp/droute-linux-amd64 \
      && /tmp/droute-linux-amd64 version"

    # Send test results through DataRouter and save the request ID.
    DATA_ROUTER_REQUEST_ID=$(oc exec -n "${droute_project}" "${droute_pod_name}" -- /bin/bash -c "
      /tmp/droute-linux-amd64 send --metadata ${temp_droute}/${METEDATA_OUTPUT} \
      --url '${DATA_ROUTER_URL}' \
      --username '${DATA_ROUTER_USERNAME}' \
      --password '${DATA_ROUTER_PASSWORD}' \
      --results '${temp_droute}/${JUNIT_RESULTS}' \
      --verbose" | grep "request:" | awk '{print $2}')

    local max_attempts=30
    local wait_seconds=2
    set +e
    for ((i = 1; i <= max_attempts; i++)); do
      # Get DataRouter request information.
      DATA_ROUTER_REQUEST_OUTPUT=$(oc exec -n "${droute_project}" "${droute_pod_name}" -- /bin/bash -c "
        /tmp/droute-linux-amd64 request get \
        --url ${DATA_ROUTER_URL} \
        --username ${DATA_ROUTER_USERNAME} \
        --password ${DATA_ROUTER_PASSWORD} \
        ${DATA_ROUTER_REQUEST_ID}")
      # Try to extract the ReportPortal launch URL from the request. This fails if it doesn't contain the launch URL.
      REPORTPORTAL_LAUNCH_URL=$(echo "$DATA_ROUTER_REQUEST_OUTPUT" | yq e '.targets[0].events[] | select(.component == "reportportal-connector") | .message | fromjson | .[0].launch_url' -)
      if [ $? -eq 0 ]; then
        echo "Successfully acquired ReportPortal launch URL."
        return 0
      else
        echo "Attempt ${i} of ${max_attempts}: ReportPortal launch URL not ready yet."
        sleep "${wait_seconds}"
      fi
      # Write ReportPortal launch URL to a HTML file with redirect. This is used to link the test run with ReportPortal (Slack alert).
      echo "<meta http-equiv='refresh' content='0; url=${REPORTPORTAL_LAUNCH_URL}'>" > "${ARTIFACT_DIR}/${project}/reportportal-launch-url.html"
    done
    set -e
    oc exec -n "${droute_project}" "${droute_pod_name}" -- /bin/bash -c "rm -rf ${temp_droute}/*"
  ) # Close subshell
  rm -f "$temp_kubeconfig" # Destroy temporary KUBECONFIG
  oc whoami --show-server
}

az_login() {
  az login --service-principal -u $ARM_CLIENT_ID -p $ARM_CLIENT_SECRET --tenant $ARM_TENANT_ID
  az account set --subscription $ARM_SUBSCRIPTION_ID
}

az_aks_start() {
  local name=$1
  local resource_group=$2
  az aks start --name $name --resource-group $resource_group
}

az_aks_stop() {
  local name=$1
  local resource_group=$2
  az aks stop --name $name --resource-group $resource_group
}

az_aks_approuting_enable() {
  local name=$1
  local resource_group=$2
  set +xe
  local output=$(az aks approuting enable --name $name --resource-group $resource_group 2>&1 | sed 's/^ERROR: //')
  set -xe
  exit_status=$?

  if [ $exit_status -ne 0 ]; then
      if [[ "$output" == *"App Routing is already enabled"* ]]; then
          echo "App Routing is already enabled. Continuing..."
      else
          echo "Error: $output"
          exit 1
      fi
  fi
}

# Merge the base YAML value file with the differences file for Kubernetes
yq_merge_value_files() {
  local base_file=$1
  local diff_file=$2
  local step_1_file="/tmp/step-without-plugins.yaml"
  local step_2_file="/tmp/step-only-plugins.yaml"
  local final_file=$3
  # Step 1: Merge files, excluding the .global.dynamic.plugins key
  # Values from `diff_file` override those in `base_file`
  yq eval-all '
    select(fileIndex == 0) * select(fileIndex == 1) |
    del(.global.dynamic.plugins)
  ' "${base_file}" "${diff_file}" > "${step_1_file}"
  # Step 2: Merge files, combining the .global.dynamic.plugins key
  # Values from `diff_file` take precedence; plugins are merged and deduplicated by the .package field
  yq eval-all '
    select(fileIndex == 0) *+ select(fileIndex == 1) |
    .global.dynamic.plugins |= (reverse | unique_by(.package) | reverse)
  ' "${base_file}" "${diff_file}" > "${step_2_file}"
  # Step 3: Combine results from the previous steps and remove null values
  # Values from `step_2_file` override those in `step_1_file`
  yq eval-all '
    select(fileIndex == 0) * select(fileIndex == 1) | del(.. | select(. == null))
  ' "${step_2_file}" "${step_1_file}" > "${final_file}"
}