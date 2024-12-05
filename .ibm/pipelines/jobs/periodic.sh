#!/bin/bash

handle_nightly() {
  oc_login

  export K8S_CLUSTER_ROUTER_BASE=$(oc get route console -n openshift-console -o=jsonpath='{.spec.host}' | sed 's/^[^.]*\.//')

  cluster_setup
  initiate_deployments
  deploy_test_backstage_provider "${NAME_SPACE}"
  local url="https://${RELEASE_NAME}-backstage-${NAME_SPACE}.${K8S_CLUSTER_ROUTER_BASE}"
  check_and_test "${RELEASE_NAME}" "${NAME_SPACE}" "${url}"
  local rbac_url="https://${RELEASE_NAME_RBAC}-backstage-${NAME_SPACE_RBAC}.${K8S_CLUSTER_ROUTER_BASE}"
  check_and_test "${RELEASE_NAME_RBAC}" "${NAME_SPACE_RBAC}" "${rbac_url}"

  # Only test TLS config with RDS and Change configuration at runtime in nightly jobs
  initiate_rds_deployment "${RELEASE_NAME}" "${NAME_SPACE_RDS}"
  local rds_url="https://${RELEASE_NAME}-backstage-${NAME_SPACE_RDS}.${K8S_CLUSTER_ROUTER_BASE}"
  check_and_test "${RELEASE_NAME}" "${NAME_SPACE_RDS}" "${rds_url}"

  # Deploy `showcase-runtime` to run tests that require configuration changes at runtime
  configure_namespace "${NAME_SPACE_RUNTIME}"
  uninstall_helmchart "${NAME_SPACE_RUNTIME}" "${RELEASE_NAME}"
  oc apply -f "$DIR/resources/redis-cache/redis-deployment.yaml" --namespace="${NAME_SPACE_RUNTIME}"

  local runtime_url="https://${RELEASE_NAME}-backstage-${NAME_SPACE_RUNTIME}.${K8S_CLUSTER_ROUTER_BASE}"

  apply_yaml_files "${DIR}" "${NAME_SPACE_RUNTIME}" "${runtime_url}"
  helm upgrade -i "${RELEASE_NAME}" -n "${NAME_SPACE_RUNTIME}" "${HELM_REPO_NAME}/${HELM_IMAGE_NAME}" --version "${CHART_VERSION}" -f "${DIR}/value_files/${HELM_CHART_VALUE_FILE_NAME}" --set global.clusterRouterBase="${K8S_CLUSTER_ROUTER_BASE}" --set upstream.backstage.image.repository="${QUAY_REPO}" --set upstream.backstage.image.tag="${TAG_NAME}"
  check_and_test "${RELEASE_NAME}" "${NAME_SPACE_RUNTIME}" "${runtime_url}"
}
