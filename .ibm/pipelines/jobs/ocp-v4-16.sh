#!/bin/sh

handle_ocp_4_16() {
  K8S_CLUSTER_URL=$(cat /tmp/secrets/RHDH_OS_1_CLUSTER_URL)
  K8S_CLUSTER_TOKEN=$(cat /tmp/secrets/RHDH_OS_1_CLUSTER_TOKEN)

  oc_login

  API_SERVER_URL=$(oc whoami --show-server)
  ENCODED_API_SERVER_URL=$(echo "${API_SERVER_URL}" | base64)
  ENCODED_CLUSTER_NAME=$(echo "my-cluster" | base64)

  export K8S_CLUSTER_ROUTER_BASE=$(oc get route console -n openshift-console -o=jsonpath='{.spec.host}' | sed 's/^[^.]*\.//')
  apply_yaml_files "${DIR}" "${NAME_SPACE}"
  deploy_test_backstage_provider "${NAME_SPACE}"
  local url="https://${release_name}-backstage-${namespace}.${K8S_CLUSTER_ROUTER_BASE}"

  initiate_deployments
  check_and_test "${RELEASE_NAME}" "${NAME_SPACE}" "${url}"
  check_and_test "${RELEASE_NAME_RBAC}" "${NAME_SPACE_RBAC}" "${url}"
}
