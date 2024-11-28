#!/bin/bash

initiate_deployments() {
  configure_namespace "${NAME_SPACE}"
  uninstall_helmchart "${NAME_SPACE}" "${RELEASE_NAME}"

  oc apply -f "$DIR/resources/redis-cache/redis-deployment.yaml" --namespace="${NAME_SPACE}"

  cd "${DIR}"
  apply_yaml_files "${DIR}" "${NAME_SPACE}"
  helm upgrade -i "${RELEASE_NAME}" -n "${NAME_SPACE}" "${HELM_REPO_NAME}/${HELM_IMAGE_NAME}" --version "${CHART_VERSION}" \
    -f "${DIR}/value_files/${HELM_CHART_VALUE_FILE_NAME}" \
    --set global.clusterRouterBase="${K8S_CLUSTER_ROUTER_BASE}" \
    --set upstream.backstage.image.repository="${QUAY_REPO}" \
    --set upstream.backstage.image.tag="${TAG_NAME}"

  configure_namespace "${NAME_SPACE_POSTGRES_DB}"

  configure_namespace "${NAME_SPACE_RBAC}"
  configure_external_postgres_db "${NAME_SPACE_RBAC}"

  uninstall_helmchart "${NAME_SPACE_RBAC}" "${RELEASE_NAME_RBAC}"
  apply_yaml_files "${DIR}" "${NAME_SPACE_RBAC}"
  helm upgrade -i "${RELEASE_NAME_RBAC}" -n "${NAME_SPACE_RBAC}" "${HELM_REPO_NAME}/${HELM_IMAGE_NAME}" --version "${CHART_VERSION}" \
    -f "${DIR}/value_files/${HELM_CHART_RBAC_VALUE_FILE_NAME}" \
    --set global.clusterRouterBase="${K8S_CLUSTER_ROUTER_BASE}" \
    --set upstream.backstage.image.repository="${QUAY_REPO}" \
    --set upstream.backstage.image.tag="${TAG_NAME}"
}

configure_namespace() {
  local project=$1
  delete_namespace "$project"
  oc create namespace "${project}"
  oc config set-context --current --namespace="${project}"
}

delete_namespace() {
  local project=$1
  if oc get namespace "$project" >/dev/null 2>&1; then
    oc delete namespace "$project" --grace-period=0 --force || true
  fi
}

check_backstage_running() {
  local release_name=$1
  local namespace=$2
  local url="https://${release_name}-backstage-${namespace}.${K8S_CLUSTER_ROUTER_BASE}"

  local max_attempts=30
  local wait_seconds=30

  for ((i = 1; i <= max_attempts; i++)); do
    local http_status
    http_status=$(curl --insecure -I -s -o /dev/null -w "%{http_code}" "${url}")
    if [ "${http_status}" -eq 200 ]; then
      export BASE_URL="${url}"
      return 0
    else
      sleep "${wait_seconds}"
    fi
  done

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
