#!/bin/bash

handle_nightly() {
  echo "Starting nightly pipeline"

  # Deploy main services
  initiate_deployments
  check_and_test "${RELEASE_NAME}" "${NAME_SPACE}"
  check_and_test "${RELEASE_NAME_RBAC}" "${NAME_SPACE_RBAC}"

  # Deploy runtime services for configuration at runtime
  configure_namespace "${NAME_SPACE_RUNTIME}"
  uninstall_helmchart "${NAME_SPACE_RUNTIME}" "${RELEASE_NAME}"
  oc apply -f "$DIR/resources/redis-cache/redis-deployment.yaml" --namespace="${NAME_SPACE_RUNTIME}"
  apply_yaml_files "${DIR}" "${NAME_SPACE_RUNTIME}"
  helm upgrade -i "${RELEASE_NAME}" -n "${NAME_SPACE_RUNTIME}" "${HELM_REPO_NAME}/${HELM_IMAGE_NAME}" \
    --version "${CHART_VERSION}" \
    -f "${DIR}/value_files/${HELM_CHART_VALUE_FILE_NAME}" \
    --set global.clusterRouterBase="${K8S_CLUSTER_ROUTER_BASE}" \
    --set upstream.backstage.image.repository="${QUAY_REPO}" \
    --set upstream.backstage.image.tag="${TAG_NAME}"
  check_and_test "${RELEASE_NAME}" "${NAME_SPACE_RUNTIME}"

  echo "Nightly pipeline completed."
}
