#!/bin/bash

initiate_deployments() {
  echo "Installing Helm and adding Helm repositories"
  install_helm
  add_helm_repos

  echo "Configuring namespace: ${NAME_SPACE}"
  configure_namespace "${NAME_SPACE}"
  uninstall_helmchart "${NAME_SPACE}" "${RELEASE_NAME}"

  echo "Applying Redis deployment in namespace: ${NAME_SPACE}"
  oc apply -f "$DIR/resources/redis-cache/redis-deployment.yaml" --namespace="${NAME_SPACE}"

  echo "Applying YAML files and deploying Helm chart for namespace: ${NAME_SPACE}"
  cd "${DIR}"
  apply_yaml_files "${DIR}" "${NAME_SPACE}"

  helm upgrade -i "${RELEASE_NAME}" -n "${NAME_SPACE}" "${HELM_REPO_NAME}/${HELM_IMAGE_NAME}" --version "${CHART_VERSION}" \
    -f "${DIR}/value_files/${HELM_CHART_VALUE_FILE_NAME}" \
    --set global.clusterRouterBase="${K8S_CLUSTER_ROUTER_BASE}" \
    --set upstream.backstage.image.repository="${QUAY_REPO}" \
    --set upstream.backstage.image.tag="${TAG_NAME}"

  echo "Configuring Postgres DB namespace: ${NAME_SPACE_POSTGRES_DB}"
  configure_namespace "${NAME_SPACE_POSTGRES_DB}"

  echo "Configuring RBAC namespace: ${NAME_SPACE_RBAC}"
  configure_namespace "${NAME_SPACE_RBAC}"
  configure_external_postgres_db "${NAME_SPACE_RBAC}"

  uninstall_helmchart "${NAME_SPACE_RBAC}" "${RELEASE_NAME_RBAC}"
  apply_yaml_files "${DIR}" "${NAME_SPACE_RBAC}"

  helm upgrade -i "${RELEASE_NAME_RBAC}" -n "${NAME_SPACE_RBAC}" "${HELM_REPO_NAME}/${HELM_IMAGE_NAME}" --version "${CHART_VERSION}" \
    -f "${DIR}/value_files/${HELM_CHART_RBAC_VALUE_FILE_NAME}" \
    --set global.clusterRouterBase="${K8S_CLUSTER_ROUTER_BASE}" \
    --set upstream.backstage.image.repository="${QUAY_REPO}" \
    --set upstream.backstage.image.tag="${TAG_NAME}"

  echo "Checking and testing deployments"
  check_and_test "${RELEASE_NAME}" "${NAME_SPACE}"
  check_and_test "${RELEASE_NAME_RBAC}" "${NAME_SPACE_RBAC}"
}

configure_namespace() {
  local project=$1
  if oc get namespace "$project" >/dev/null 2>&1; then
    echo "Namespace ${project} already exists. Skipping creation."
  else
    oc create namespace "${project}" || {
      echo "Error creating namespace ${project}" >&2
      return 1
    }
  fi
  oc config set-context --current --namespace="${project}"
}

delete_namespace() {
  local project=$1
  if oc get namespace "$project" >/dev/null 2>&1; then
    echo "Namespace ${project} exists. Attempting to delete..."
    remove_finalizers_from_resources "$project"
    oc delete namespace "$project" --grace-period=0 --force || true
  fi
}

wait_for_pods_ready() {
  local namespace=$1
  local max_attempts=10
  local wait_seconds=10

  log_info "Waiting for pods in namespace '${namespace}' to be ready..."
  for ((i = 1; i <= max_attempts; i++)); do
    local ready_pods=$(kubectl get pods -n "${namespace}" --no-headers | grep 'Running' | wc -l)
    local total_pods=$(kubectl get pods -n "${namespace}" --no-headers | wc -l)

    if [[ "$ready_pods" -eq "$total_pods" && "$total_pods" -gt 0 ]]; then
      log_info "All pods are ready in namespace '${namespace}' (${ready_pods}/${total_pods})."
      return 0
    fi

    log_info "Attempt ${i}/${max_attempts}: Pods not ready (${ready_pods}/${total_pods}). Retrying in ${wait_seconds}s..."
    sleep "$wait_seconds"
  done

  log_error "Pods in namespace '${namespace}' failed to become ready after ${max_attempts} attempts."
  return 1
}

check_backstage_running() {
  local release_name=$1
  local namespace=$2

  if ! command -v curl &>/dev/null; then
    echo "Error: curl is required but not installed. Exiting."
    return 1
  fi

  wait_for_pods_ready "${namespace}"

  local url="https://${release_name}-backstage-${namespace}.${K8S_CLUSTER_ROUTER_BASE}"
  echo "Generated URL for Backstage: ${url}"

  local max_attempts=30
  local wait_seconds=30

  echo "Checking if Backstage is up and running at ${url}"
  local start_time=$(date +%s)

  for ((i = 1; i <= max_attempts; i++)); do
    local http_status
    http_status=$(curl --insecure -I -s -o /dev/null -w "%{http_code}" "${url}")

    if [[ "${http_status}" -eq 200 ]]; then
      local end_time=$(date +%s)
      local elapsed_time=$((end_time - start_time))
      echo "Backstage is up and running at ${url}! (Time: ${elapsed_time}s)"
      export BASE_URL="${url}"
      echo "######## BASE URL ########"
      echo "${BASE_URL}"
      return 0
    fi

    echo "Attempt ${i}/${max_attempts}: Backstage not yet available (HTTP Status: ${http_status})"
    curl --insecure -I -s "${url}" || echo "Error fetching response headers."
    sleep "${wait_seconds}"
  done

  echo "Failed to reach Backstage at ${url} after ${max_attempts} attempts." | tee -a "/tmp/${LOGFILE}"
  mkdir -p "${ARTIFACT_DIR}/${namespace}/"
  cp -a "/tmp/${LOGFILE}" "${ARTIFACT_DIR}/${namespace}/"
  return 1
}

check_and_test() {
  local release_name=$1
  local namespace=$2
  if check_backstage_running "${release_name}" "${namespace}"; then
    oc get pods -n "${namespace}"
    run_tests "${release_name}" "${namespace}"
  else
    OVERALL_RESULT=1
  fi
  save_all_pod_logs "${namespace}"
}

run_tests() {
  local release_name=$1
  local namespace=$2

  cd "${DIR}/../../e2e-tests"
  yarn install
  yarn playwright install chromium

  Xvfb :99 &
  export DISPLAY=:99

  (
    set -e
    echo "Using PR container image: ${TAG_NAME}"
    yarn "${namespace}"
  ) 2>&1 | tee "/tmp/${LOGFILE}"

  local RESULT=${PIPESTATUS[0]}
  pkill Xvfb

  if [ "${RESULT}" -ne 0 ]; then
    OVERALL_RESULT=1
  fi
}

generate_failure_report() {
  local namespace=$1
  log_info "Generating failure report for namespace: ${namespace}"

  kubectl get all -n "${namespace}" > "/tmp/${namespace}_resources.txt"
  kubectl describe all -n "${namespace}" > "/tmp/${namespace}_describe.txt"
  kubectl logs -l app.kubernetes.io/name=backstage -n "${namespace}" > "/tmp/${namespace}_backstage_logs.txt"
  log_info "Failure report saved to /tmp/"
}
