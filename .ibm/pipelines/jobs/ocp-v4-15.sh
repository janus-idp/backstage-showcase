#!/bin/sh

handle_ocp_4_15() {
  oc_login

  export K8S_CLUSTER_ROUTER_BASE=$(oc get route console -n openshift-console -o=jsonpath='{.spec.host}' | sed 's/^[^.]*\.//')
  apply_yaml_files "${DIR}" "${NAME_SPACE}"
  deploy_test_backstage_provider "${NAME_SPACE}"
  local url="https://${release_name}-backstage-${namespace}.${K8S_CLUSTER_ROUTER_BASE}"

  initiate_deployments
  check_and_test "${RELEASE_NAME}" "${NAME_SPACE}" "${url}"
  check_and_test "${RELEASE_NAME_RBAC}" "${NAME_SPACE_RBAC}" "${url}"
}
