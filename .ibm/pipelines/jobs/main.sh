#!/bin/sh

set -x

handle_main() {
  echo "Configuring namespace: ${NAME_SPACE}"
  oc_login
  echo "OCP version: $(oc version)"

  export K8S_CLUSTER_ROUTER_BASE=$(oc get route console -n openshift-console -o=jsonpath='{.spec.host}' | sed 's/^[^.]*\.//')
  local url="https://${RELEASE_NAME}-backstage-${NAME_SPACE}.${K8S_CLUSTER_ROUTER_BASE}"
  cluster_setup
  initiate_deployments
  deploy_test_backstage_provider "${NAME_SPACE}"
  check_and_test "${RELEASE_NAME}" "${NAME_SPACE}" "${url}"
  check_and_test "${RELEASE_NAME_RBAC}" "${NAME_SPACE_RBAC}" "${url}"
}
